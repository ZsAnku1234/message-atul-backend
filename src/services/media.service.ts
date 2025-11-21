import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import createHttpError from "http-errors";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";

export interface MediaUploadResult {
  url: string;
  type: UploadApiResponse["resource_type"];
  publicId: string;
  bytes: number;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
}

const toDataUri = (file: Express.Multer.File): string => {
  const base64 = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${base64}`;
};

const normalizeType = (value?: string): UploadApiResponse["resource_type"] => {
  if (value === "video" || value === "image" || value === "raw") {
    return value;
  }
  return "raw";
};

const typeFromMime = (mime?: string): UploadApiResponse["resource_type"] => {
  if (!mime) {
    return "raw";
  }
  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  return "raw";
};

const ensureUploadDir = (() => {
  let ready: Promise<void> | null = null;
  return () => {
    if (!ready) {
      ready = fs.mkdir(env.media.uploadDir, { recursive: true }).then(() => undefined);
    }
    return ready;
  };
})();

const saveLocally = async (files: Express.Multer.File[]): Promise<MediaUploadResult[]> => {
  await ensureUploadDir();
  return Promise.all(
    files.map(async (file) => {
      const extension = path.extname(file.originalname) || "";
      const suffix = extension || deriveExtensionFromMime(file.mimetype);
      const filename = `${Date.now()}-${randomUUID()}${suffix}`;
      const targetPath = path.join(env.media.uploadDir, filename);
      await fs.writeFile(targetPath, file.buffer);

      return {
        url: `${env.media.publicBaseUrl}/uploads/${filename}`,
        type: typeFromMime(file.mimetype),
        publicId: filename,
        bytes: file.size ?? file.buffer.length,
        format: suffix.replace(".", "") || undefined
      };
    })
  );
};

const deriveExtensionFromMime = (mime?: string): string => {
  if (!mime?.includes("/")) {
    return "";
  }
  const [, ext] = mime.split("/");
  if (!ext) {
    return "";
  }
  return `.${ext}`;
};

const uploadWithCloudinary = async (files: Express.Multer.File[]): Promise<MediaUploadResult[]> => {
  try {
    return await Promise.all(
      files.map(async (file) => {
        const upload = await cloudinary.uploader.upload(toDataUri(file), {
          folder: env.cloudinary.uploadFolder,
          resource_type: "auto"
        });

        return {
          url: upload.secure_url,
          type: normalizeType(upload.resource_type),
          publicId: upload.public_id,
          bytes: upload.bytes,
          format: upload.format,
          width: upload.width ?? undefined,
          height: upload.height ?? undefined,
          duration: upload.duration ?? undefined
        };
      })
    );
  } catch (error) {
    console.error("Failed to upload media", error);
    throw createHttpError(500, "Unable to upload media right now");
  }
};

export const uploadMediaFiles = async (files: Express.Multer.File[]): Promise<MediaUploadResult[]> => {
  if (!files.length) {
    throw createHttpError(400, "Please attach at least one file");
  }

  if (env.media.storage === "local") {
    return saveLocally(files);
  }

  return uploadWithCloudinary(files);
};
