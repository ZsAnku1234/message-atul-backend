import createHttpError from "http-errors";
import type { Request, Response } from "express";
import { uploadMediaFiles } from "../services/media.service";

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];

  if (!files.length) {
    throw createHttpError(400, "No files provided");
  }

  const attachments = await uploadMediaFiles(files);
  res.status(201).json({ attachments });
};
