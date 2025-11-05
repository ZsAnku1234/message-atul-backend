import createHttpError from "http-errors";
import { ConversationModel } from "../models/Conversation";
import { MessageModel } from "../models/Message";

export const createDirectConversation = async (userId: string, participantIds: string[]) => {
  const participantSet = new Set([userId, ...participantIds]);

  if (!participantSet.has(userId)) {
    participantSet.add(userId);
  }

  const participants = Array.from(participantSet);

  if (participants.length < 2) {
    throw createHttpError(400, "Conversation requires at least two participants");
  }

  const existing = await ConversationModel.findOne({
    participants: { $size: participants.length, $all: participants }
  });

  if (existing) {
    return existing;
  }

  return ConversationModel.create({
    participants,
    lastMessageAt: new Date()
  });
};

export const getConversationsForUser = async (userId: string) => {
  const conversations = await ConversationModel.find({ participants: userId })
    .populate("participants", "displayName email avatarUrl")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt",
      populate: { path: "sender", select: "displayName avatarUrl" }
    })
    .sort({ updatedAt: -1 });

  return conversations;
};

export const getConversationById = async (conversationId: string, userId: string) => {
  const conversation = await ConversationModel.findById(conversationId)
    .populate("participants", "displayName email avatarUrl")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt",
      populate: { path: "sender", select: "displayName avatarUrl" }
    });

  if (!conversation) {
    throw createHttpError(404, "Conversation not found");
  }

  const hasAccess = conversation.participants.some((participant) => {
    if (typeof (participant as any).equals === "function") {
      return (participant as any).equals(userId);
    }

    return String((participant as any)._id ?? "") === userId;
  });

  if (!hasAccess) {
    throw createHttpError(403, "You do not have access to this conversation");
  }

  return conversation;
};

export const getRecentMessages = async (conversationId: string, limit = 50) => {
  return MessageModel.find({ conversation: conversationId })
    .populate("sender", "displayName avatarUrl")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};
