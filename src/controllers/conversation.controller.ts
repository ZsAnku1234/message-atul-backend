import type { Request, Response } from "express";
import {
  createDirectConversation,
  getConversationById,
  getConversationsForUser,
  getRecentMessages
} from "../services/conversation.service";

export const create = async (req: Request, res: Response): Promise<void> => {
  const participantIds: string[] = req.body.participantIds;
  const conversation = await createDirectConversation(req.user!.id, participantIds);
  res.status(201).json({ conversation });
};

export const list = async (req: Request, res: Response): Promise<void> => {
  const conversations = await getConversationsForUser(req.user!.id);
  res.json({ conversations });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const conversation = await getConversationById(id, req.user!.id);
  const messages = await getRecentMessages(id);
  res.json({ conversation, messages });
};
