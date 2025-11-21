import createHttpError from "http-errors";
import { Types } from "mongoose";
import { ConversationModel } from "../models/Conversation";
import { MessageModel, type MessageDocument } from "../models/Message";
import { socketGateway } from "../socket/socketGateway";
import { assertConversationParticipant } from "./conversation.service";

const populateMessage = (message: MessageDocument) =>
  message.populate("sender", "displayName avatarUrl phoneNumber statusMessage").then((doc) => doc.toObject());

const isParticipant = (conversation: { participants: Types.ObjectId[] }, userId: string) =>
  conversation.participants.some((participant) => participant.equals(userId));

const isConversationAdmin = (conversation: { createdBy: Types.ObjectId; admins?: Types.ObjectId[] }, userId: string) => {
  if (conversation.createdBy.toString() === userId) {
    return true;
  }

  return (conversation.admins ?? []).some((admin) => admin.equals(userId));
};

export const sendMessage = async (params: {
  conversationId: string;
  senderId: string;
  content?: string;
  attachments?: string[];
}) => {
  const conversation = await ConversationModel.findById(params.conversationId);

  if (!conversation) {
    throw createHttpError(404, "Conversation not found");
  }

  if (!isParticipant(conversation, params.senderId)) {
    throw createHttpError(403, "You are not part of this conversation");
  }

  if (conversation.adminOnlyMessaging && !isConversationAdmin(conversation, params.senderId)) {
    throw createHttpError(403, "Only conversation admins can send messages right now");
  }

  const normalizedContent = params.content?.trim() ?? "";
  const attachments = (params.attachments ?? []).filter((item) => typeof item === "string" && item.trim().length > 0);

  if (!normalizedContent && attachments.length === 0) {
    throw createHttpError(400, "Provide message content or at least one attachment");
  }

  const message = await MessageModel.create({
    conversation: params.conversationId,
    sender: params.senderId,
    content: normalizedContent,
    attachments
  });

  conversation.lastMessage = message._id as Types.ObjectId;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  const payload = await populateMessage(message);
  socketGateway.emitToConversation(params.conversationId, "message:new", payload);
  return payload;
};

export const updateMessage = async (params: {
  messageId: string;
  editorId: string;
  content?: string;
  attachments?: string[];
}) => {
  const message = await MessageModel.findById(params.messageId);

  if (!message) {
    throw createHttpError(404, "Message not found");
  }

  const conversation = await ConversationModel.findById(message.conversation);

  if (!conversation) {
    throw createHttpError(404, "Conversation not found");
  }

  if (conversation.adminOnlyMessaging && !isConversationAdmin(conversation, params.editorId)) {
    throw createHttpError(403, "Only conversation admins can edit messages right now");
  }

  if (message.sender.toString() !== params.editorId) {
    throw createHttpError(403, "You can only edit your own messages");
  }

  const editWindowMs = 15 * 60 * 1000; // 15 minutes
  const ageMs = Date.now() - message.createdAt.getTime();
  if (ageMs > editWindowMs) {
    throw createHttpError(400, "Messages can only be edited within 15 minutes of sending");
  }

  const normalizedContent = params.content?.trim() ?? "";
  const attachments = (params.attachments ?? []).filter((item) => typeof item === "string" && item.trim().length > 0);

  if (!normalizedContent && attachments.length === 0) {
    throw createHttpError(400, "Provide message content or at least one attachment");
  }

  message.content = normalizedContent;
  message.attachments = attachments;
  await message.save();

  const payload = await populateMessage(message);
  socketGateway.emitToConversation(message.conversation.toString(), "message:updated", payload);
  return payload;
};

export const deleteMessage = async (params: { messageId: string; requesterId: string }) => {
  const message = await MessageModel.findById(params.messageId);

  if (!message) {
    throw createHttpError(404, "Message not found");
  }

  const conversation = await assertConversationParticipant(message.conversation.toString(), params.requesterId);

  const isOwner = message.sender.toString() === params.requesterId;
  const isConversationCreator = conversation.createdBy.toString() === params.requesterId;
  const isAdmin = isConversationAdmin(conversation, params.requesterId);

  if (!isOwner && !isConversationCreator && !isAdmin) {
    throw createHttpError(403, "You do not have permission to delete this message");
  }

  await message.deleteOne();

  if (conversation.lastMessage?.toString() === params.messageId) {
    const latest = await MessageModel.findOne({ conversation: conversation.id }).sort({ createdAt: -1 });
    conversation.lastMessage = latest ? (latest._id as Types.ObjectId) : undefined;
    conversation.lastMessageAt = latest?.createdAt ?? undefined;
    await conversation.save();
  }

  socketGateway.emitToConversation(message.conversation.toString(), "message:deleted", {
    messageId: params.messageId,
    conversationId: message.conversation.toString()
  });
};

export const getMessageById = async (messageId: string, userId: string) => {
  const message = await MessageModel.findById(messageId).populate("sender", "displayName avatarUrl phoneNumber statusMessage");

  if (!message) {
    throw createHttpError(404, "Message not found");
  }

  await assertConversationParticipant(message.conversation.toString(), userId);
  return message.toObject();
};
