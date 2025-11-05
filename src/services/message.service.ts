import createHttpError from "http-errors";
import { Types } from "mongoose";
import { ConversationModel } from "../models/Conversation";
import { MessageModel } from "../models/Message";

export const sendMessage = async (params: {
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: string[];
}) => {
  const conversation = await ConversationModel.findById(params.conversationId);

  if (!conversation) {
    throw createHttpError(404, "Conversation not found");
  }

  const isParticipant = conversation.participants.some((participant) => participant.equals(params.senderId));

  if (!isParticipant) {
    throw createHttpError(403, "You are not part of this conversation");
  }

  const message = await MessageModel.create({
    conversation: params.conversationId,
    sender: params.senderId,
    content: params.content,
    attachments: params.attachments ?? []
  });

  conversation.lastMessage = message._id as Types.ObjectId;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  return message.populate("sender", "displayName avatarUrl");
};
