import type { Request, Response } from "express";
import { sendMessage } from "../services/message.service";

export const send = async (req: Request, res: Response): Promise<void> => {
  const { conversationId, content, attachments } = req.body;
  const message = await sendMessage({
    conversationId,
    senderId: req.user!.id,
    content,
    attachments
  });

  res.status(201).json({ message });
};
