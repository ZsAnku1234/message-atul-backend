import type { Request, Response } from "express";
import { deleteMessage, getMessageById, sendMessage, updateMessage } from "../services/message.service";

export const send = async (req: Request, res: Response): Promise<void> => {
  const { conversationId, content, attachments } = req.body as {
    conversationId: string;
    content?: string;
    attachments?: string[];
  };
  const message = await sendMessage({
    conversationId,
    senderId: req.user!.id,
    content,
    attachments
  });

  res.status(201).json({ message });
};

export const edit = async (req: Request, res: Response): Promise<void> => {
  const { content, attachments } = req.body as {
    content?: string;
    attachments?: string[];
  };
  const message = await updateMessage({
    messageId: req.params.id,
    editorId: req.user!.id,
    content,
    attachments
  });

  res.json({ message });
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  await deleteMessage({
    messageId: req.params.id,
    requesterId: req.user!.id
  });

  res.status(204).send();
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const message = await getMessageById(req.params.id, req.user!.id);
  res.json({ message });
};
