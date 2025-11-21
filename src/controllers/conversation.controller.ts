import createHttpError from "http-errors";
import type { Request, Response } from "express";
import {
  addParticipantsToConversation,
  createConversation,
  deleteConversation,
  getConversationById,
  getConversationMessages,
  getConversationsForUser,
  removeParticipantFromConversation,
  setConversationAdminOnlyMessaging,
  updateConversation,
  updateConversationAdmins
} from "../services/conversation.service";

export const create = async (req: Request, res: Response): Promise<void> => {
  const { participantIds, title, isPrivate } = req.body as {
    participantIds: string[];
    title?: string;
    isPrivate?: boolean;
  };
  const conversation = await createConversation(req.user!.id, participantIds, {
    title,
    isPrivate,
  });
  res.status(201).json({ conversation });
};

export const list = async (req: Request, res: Response): Promise<void> => {
  const conversations = await getConversationsForUser(req.user!.id);
  res.json({ conversations });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const conversation = await getConversationById(id, req.user!.id);
  const messages = await getConversationMessages(id, req.user!.id, { limit: 50 });
  res.json({ conversation, messages });
};

export const update = async (req: Request, res: Response): Promise<void> => {
  if (typeof req.body.title === "undefined") {
    throw createHttpError(400, "Provide at least one field to update");
  }
  const conversation = await updateConversation(req.params.id, req.user!.id, req.body.title);
  res.json({ conversation });
};

export const addParticipants = async (req: Request, res: Response): Promise<void> => {
  const conversation = await addParticipantsToConversation(req.params.id, req.user!.id, req.body.participantIds);
  res.json({ conversation });
};

export const removeParticipant = async (req: Request, res: Response): Promise<void> => {
  const conversation = await removeParticipantFromConversation(req.params.id, req.user!.id, req.params.userId);

  if (!conversation) {
    res.status(204).send();
    return;
  }

  res.json({ conversation });
};

export const destroy = async (req: Request, res: Response): Promise<void> => {
  await deleteConversation(req.params.id, req.user!.id);
  res.status(204).send();
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const messages = await getConversationMessages(req.params.id, req.user!.id, { limit, before });
  res.json({ messages });
};

export const updateAdmins = async (req: Request, res: Response): Promise<void> => {
  const { add = [], remove = [] } = req.body as { add?: string[]; remove?: string[] };
  if ((add?.length ?? 0) + (remove?.length ?? 0) === 0) {
    throw createHttpError(400, "Provide at least one admin change");
  }
  const conversation = await updateConversationAdmins(req.params.id, req.user!.id, { add, remove });
  res.json({ conversation });
};

export const setAdminMessageControl = async (req: Request, res: Response): Promise<void> => {
  const { adminOnlyMessaging } = req.body as { adminOnlyMessaging: boolean };
  const conversation = await setConversationAdminOnlyMessaging(req.params.id, req.user!.id, adminOnlyMessaging);
  res.json({ conversation });
};
