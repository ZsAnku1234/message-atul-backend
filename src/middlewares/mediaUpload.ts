import createHttpError from "http-errors";
import multer from "multer";
import type { Request } from "express";
import { env } from "../config/env";

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
    return;
  }

  cb(createHttpError(400, "Only image or video uploads are allowed"));
};

export const mediaUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.media.maxFileSizeBytes
  }
}).array("files", env.media.maxAttachmentCount);
