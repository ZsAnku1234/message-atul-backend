import createHttpError from "http-errors";
import { Types } from "mongoose";
import { ConversationModel, type ConversationDocument } from "../models/Conversation";
import { MessageModel } from "../models/Message";
import { socketGateway } from "../socket/socketGateway";

const participantMatch = (participant: unknown, userId: string): boolean => {
  if (!participant) {
    return false;
  }

  if (participant instanceof Types.ObjectId) {
    return participant.equals(userId);
  }

  if (typeof participant === "object" && "_id" in (participant as Record<string, unknown>)) {
    const identifier = String((participant as Record<string, unknown>)._id);
    return new Types.ObjectId(identifier).equals(userId);
  }

  return String(participant) === userId;
};

const participantSetFromDocument = (conversation: { participants: unknown[] }): string[] => {
  return conversation.participants.map((participant) => {
    if (participant instanceof Types.ObjectId) {
      return participant.toString();
    }

    if (typeof participant === "object" && participant && "_id" in (participant as Record<string, unknown>)) {
      return String((participant as Record<string, unknown>)._id);
    }

    return String(participant);
  });
};

const isConversationAdmin = (conversation: ConversationDocument, userId: string): boolean => {
  if (conversation.createdBy.toString() === userId) {
    return true;
  }

  return conversation.admins.some((admin) => admin.equals(userId));
};

const emitConversationUpdate = (conversationId: string, conversation: ConversationDocument | unknown) => {
  const payload = { conversation };
  socketGateway.emitToConversation(conversationId, "conversation:updated", payload);
  participantSetFromDocument(conversation as { participants: unknown[] }).forEach((participantId) => {
    socketGateway.emitToUser(participantId, "conversation:updated", payload);
  });
};

const toObjectId = (value: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw createHttpError(400, "Invalid identifier provided");
  }
  return new Types.ObjectId(value);
};

export const assertConversationParticipant = async (
  conversationId: string,
  userId: string
): Promise<ConversationDocument> => {
  const conversation = await ConversationModel.findById(conversationId);

  if (!conversation) {
    throw createHttpError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some((participant) => participantMatch(participant, userId));

  if (!isParticipant) {
    throw createHttpError(403, "You do not have access to this conversation");
  }

  return conversation;
};

export const createConversation = async (
  creatorId: string,
  participantIds: string[],
  options: { title?: string; isPrivate?: boolean; adminOnlyMessaging?: boolean } = {}
): Promise<ConversationDocument> => {
  const { title, isPrivate = false, adminOnlyMessaging = false } = options;
  const participantSet = new Set([creatorId, ...participantIds]);
  const participants = Array.from(participantSet);

  if (participants.length < 2) {
    throw createHttpError(400, "Conversation requires at least two participants");
  }

  const isGroup = participants.length > 2 || Boolean(title?.trim().length);

  const existing =
    !isGroup &&
    (await ConversationModel.findOne({
      participants: { $size: participants.length, $all: participants },
      isGroup: false
    }));

  if (existing) {
    return getConversationById(existing.id, creatorId);
  }

  const conversation = await ConversationModel.create({
    participants,
    lastMessageAt: new Date(),
    createdBy: creatorId,
    title: title?.trim() || undefined,
    isGroup,
    isPrivate: isGroup ? isPrivate : false,
    admins: [toObjectId(creatorId)],
    adminOnlyMessaging: isGroup ? adminOnlyMessaging : false
  });

  const populated = await ConversationModel.findById(conversation._id)
    .populate("participants", "displayName phoneNumber avatarUrl statusMessage")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt attachments",
      populate: { path: "sender", select: "displayName avatarUrl phoneNumber statusMessage" }
    })
    .lean();

  if (populated) {
    const payload = {
      conversation: populated
    };

    socketGateway.emitToConversation(conversation.id, "conversation:created", payload);

    participantSet.forEach((participantId) => {
      socketGateway.emitToUser(participantId, "conversation:created", payload);
    });
  }

  return getConversationById(conversation.id, creatorId);
};

export const getConversationsForUser = async (userId: string) => {
  return ConversationModel.find({ participants: userId })
    .populate("participants", "displayName phoneNumber avatarUrl statusMessage")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt attachments",
      populate: { path: "sender", select: "displayName avatarUrl phoneNumber statusMessage" }
    })
    .sort({ updatedAt: -1 });
};

export const getConversationById = async (conversationId: string, userId: string) => {
  const conversation = await ConversationModel.findById(conversationId)
    .populate("participants", "displayName phoneNumber avatarUrl statusMessage")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt attachments",
      populate: { path: "sender", select: "displayName avatarUrl phoneNumber statusMessage" }
    });

  if (!conversation) {
    throw createHttpError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some((participant) => participantMatch(participant, userId));

  if (!isParticipant) {
    throw createHttpError(403, "You do not have access to this conversation");
  }

  return conversation;
};

export const updateConversation = async (conversationId: string, userId: string, title: string | undefined) => {
  const conversation = await assertConversationParticipant(conversationId, userId);

  if (conversation.createdBy.toString() !== userId && !conversation.isGroup) {
    throw createHttpError(403, "Only the conversation creator can update this conversation");
  }

  conversation.title = title?.trim() || undefined;
  conversation.isGroup = Boolean(conversation.title) || conversation.participants.length > 2;
  await conversation.save();

  const populated = await getConversationById(conversationId, userId);
  const payload = { conversation: populated };
  socketGateway.emitToConversation(conversationId, "conversation:updated", payload);
  participantSetFromDocument(populated).forEach((participantId) => {
    socketGateway.emitToUser(participantId, "conversation:updated", payload);
  });
  return populated;
};

export const addParticipantsToConversation = async (
  conversationId: string,
  userId: string,
  participantIds: string[]
) => {
  const conversation = await assertConversationParticipant(conversationId, userId);

  if (!isConversationAdmin(conversation, userId)) {
    throw createHttpError(403, "Only conversation admins can add participants");
  }

  const unique = new Set(conversation.participants.map((id) => id.toString()));
  const newParticipants: string[] = [];
  let modified = false;

  participantIds.forEach((id) => {
    if (!unique.has(id)) {
      unique.add(id);
      conversation.participants.push(new Types.ObjectId(id));
      newParticipants.push(id);
      modified = true;
    }
  });

  if (!modified) {
    return getConversationById(conversationId, userId);
  }

  conversation.isGroup = true;
  await conversation.save();

  const populated = await getConversationById(conversationId, userId);
  const payload = { conversation: populated };
  socketGateway.emitToConversation(conversationId, "conversation:updated", payload);
  newParticipants.forEach((participantId) => {
    socketGateway.emitToUser(participantId, "conversation:added", payload);
  });
  participantSetFromDocument(populated).forEach((participantId) => {
    socketGateway.emitToUser(participantId, "conversation:updated", payload);
  });
  return populated;
};

export const removeParticipantFromConversation = async (
  conversationId: string,
  requesterId: string,
  participantId: string
) => {
  const conversation = await assertConversationParticipant(conversationId, requesterId);

  const isAdminRequester = isConversationAdmin(conversation, requesterId);

  if (!isAdminRequester && requesterId !== participantId) {
    throw createHttpError(403, "Only conversation admins can remove other participants");
  }

  if (conversation.createdBy.toString() === participantId) {
    throw createHttpError(403, "The conversation creator cannot be removed");
  }

  const beforeCount = conversation.participants.length;
  conversation.participants = conversation.participants.filter((participant) => !participantMatch(participant, participantId));
  conversation.admins = conversation.admins.filter((admin) => !admin.equals(participantId));

  if (!conversation.admins.some((admin) => admin.equals(conversation.createdBy))) {
    conversation.admins.push(conversation.createdBy);
  }

  if (conversation.participants.length === beforeCount) {
    throw createHttpError(404, "Participant not found in conversation");
  }

  if (conversation.participants.length < 2) {
    socketGateway.emitToUser(participantId, "conversation:deleted", { conversationId });
    await deleteConversation(conversationId, requesterId, { skipAuthCheck: true });
    return "";
  }

  await conversation.save();

  const populated = await getConversationById(conversationId, requesterId);
  const payload = { conversation: populated };
  socketGateway.emitToConversation(conversationId, "conversation:updated", payload);
  participantSetFromDocument(populated).forEach((participantId) => {
    socketGateway.emitToUser(participantId, "conversation:updated", payload);
  });
  socketGateway.emitToUser(participantId, "conversation:removed", { conversationId });
  return populated;
};

export const updateConversationAdmins = async (
  conversationId: string,
  requesterId: string,
  options: { add?: string[]; remove?: string[] }
) => {
  const conversation = await assertConversationParticipant(conversationId, requesterId);

  if (!isConversationAdmin(conversation, requesterId)) {
    throw createHttpError(403, "Only conversation admins can manage admin roles");
  }

  if (!conversation.isGroup) {
    throw createHttpError(400, "Admin roles are only available for group conversations");
  }

  const add = new Set(options.add ?? []);
  const remove = new Set(options.remove ?? []);

  if (add.size === 0 && remove.size === 0) {
    return getConversationById(conversationId, requesterId);
  }

  const participantIds = new Set(participantSetFromDocument(conversation));
  const creatorId = conversation.createdBy.toString();
  const adminIds = new Set<string>(conversation.admins.map((admin) => admin.toString()));
  adminIds.add(creatorId);
  const originalAdmins = new Set(adminIds);

  add.forEach((id) => {
    if (!participantIds.has(id)) {
      throw createHttpError(400, "Admins must be part of the conversation");
    }
    if (!adminIds.has(id)) {
      adminIds.add(id);
    }
  });

  remove.forEach((id) => {
    if (id === creatorId) {
      throw createHttpError(400, "The conversation creator must remain an admin");
    }
    adminIds.delete(id);
  });

  if (
    adminIds.size === originalAdmins.size &&
    Array.from(adminIds).every((id) => originalAdmins.has(id))
  ) {
    return getConversationById(conversationId, requesterId);
  }

  conversation.admins = Array.from(adminIds).map((id) => toObjectId(id));
  await conversation.save();

  const populated = await getConversationById(conversationId, requesterId);
  emitConversationUpdate(conversationId, populated);
  return populated;
};

export const setConversationAdminOnlyMessaging = async (
  conversationId: string,
  requesterId: string,
  adminOnly: boolean
) => {
  const conversation = await assertConversationParticipant(conversationId, requesterId);

  if (!isConversationAdmin(conversation, requesterId)) {
    throw createHttpError(403, "Only conversation admins can modify message controls");
  }

  if (!conversation.isGroup) {
    throw createHttpError(400, "Message control mode is only available for group conversations");
  }

  if (conversation.adminOnlyMessaging === adminOnly) {
    return getConversationById(conversationId, requesterId);
  }

  conversation.adminOnlyMessaging = adminOnly;
  await conversation.save();

  const populated = await getConversationById(conversationId, requesterId);
  emitConversationUpdate(conversationId, populated);
  return populated;
};

export const deleteConversation = async (
  conversationId: string,
  userId: string,
  options: { skipAuthCheck?: boolean } = {}
) => {
  let conversation: ConversationDocument | null;
  let participantIds: string[] = [];

  if (options.skipAuthCheck) {
    conversation = await ConversationModel.findById(conversationId);
  } else {
    conversation = await assertConversationParticipant(conversationId, userId);
  }

  if (!conversation) {
    throw createHttpError(404, "Conversation not found");
  }

  if (!options.skipAuthCheck && conversation.createdBy.toString() !== userId) {
    throw createHttpError(403, "Only the creator can delete the conversation");
  }

  participantIds = conversation.participants.map((participant) => participant.toString());

  await MessageModel.deleteMany({ conversation: conversationId });
  await conversation.deleteOne();
  const payload = { conversationId };
  socketGateway.emitToConversation(conversationId, "conversation:deleted", payload);
  participantIds.forEach((participantId) => {
    socketGateway.emitToUser(participantId, "conversation:deleted", payload);
  });
};

export const getConversationMessages = async (
  conversationId: string,
  userId: string,
  options: { limit?: number; before?: string } = {}
) => {
  await assertConversationParticipant(conversationId, userId);

  const { limit = 50, before } = options;
  const query: Record<string, unknown> = { conversation: conversationId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await MessageModel.find(query)
    .populate("sender", "displayName avatarUrl phoneNumber statusMessage")
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();

  return messages;
};
