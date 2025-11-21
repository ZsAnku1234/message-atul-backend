import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET should be at least 32 characters"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "dcmb4ila2"),
  CLOUDINARY_API_KEY: z.string().min(1, "355744866469354"),
  CLOUDINARY_API_SECRET: z.string().min(1, "8RLtrhTPu-u8e5gYezs6C-mcBhY"),
  CLOUDINARY_UPLOAD_FOLDER: z.string().optional(),
  MEDIA_MAX_FILE_SIZE_MB: z.string().default("15"),
  MEDIA_MAX_ATTACHMENTS: z.string().default("5"),
  MEDIA_STORAGE_DRIVER: z.enum(["cloudinary", "local"]).optional(),
  MEDIA_UPLOAD_DIR: z.string().default("uploads"),
  MEDIA_PUBLIC_BASE_URL: z.string().url().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

const maxFileSizeMb = Number(parsed.data.MEDIA_MAX_FILE_SIZE_MB);
const maxAttachments = Number(parsed.data.MEDIA_MAX_ATTACHMENTS);

const isPlaceholder = (value: string, placeholder?: string): boolean => {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized.length) {
    return true;
  }
  if (placeholder && normalized === placeholder.trim().toLowerCase()) {
    return true;
  }
  return normalized.startsWith("your-");
};

const hasCloudinaryConfig =
  !isPlaceholder(parsed.data.CLOUDINARY_CLOUD_NAME, "dcmb4ila2") &&
  !isPlaceholder(parsed.data.CLOUDINARY_API_KEY, "355744866469354") &&
  !isPlaceholder(parsed.data.CLOUDINARY_API_SECRET, "8RLtrhTPu-u8e5gYezs6C-mcBhY");

const requestedDriver = parsed.data.MEDIA_STORAGE_DRIVER ?? "cloudinary";
const storageDriver = requestedDriver === "local" ? "local" : hasCloudinaryConfig ? "cloudinary" : "local";

if (requestedDriver === "cloudinary" && storageDriver === "local") {
  console.warn("[env] Cloudinary credentials missing. Falling back to local media storage.");
}

const resolvedUploadDir = path.isAbsolute(parsed.data.MEDIA_UPLOAD_DIR)
  ? parsed.data.MEDIA_UPLOAD_DIR
  : path.resolve(process.cwd(), parsed.data.MEDIA_UPLOAD_DIR);

const fallbackBaseUrl = parsed.data.MEDIA_PUBLIC_BASE_URL ?? `http://localhost:${parsed.data.PORT ?? "5000"}`;
const normalizedBaseUrl = fallbackBaseUrl.replace(/\/$/, "");

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: Number(parsed.data.PORT),
  mongoUri: parsed.data.MONGO_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  cloudinary: {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
    uploadFolder: parsed.data.CLOUDINARY_UPLOAD_FOLDER
  },
  media: {
    maxFileSizeBytes: Number.isFinite(maxFileSizeMb) ? maxFileSizeMb * 1024 * 1024 : 15 * 1024 * 1024,
    maxAttachmentCount: Number.isFinite(maxAttachments) ? maxAttachments : 5,
    storage: storageDriver,
    uploadDir: resolvedUploadDir,
    publicBaseUrl: normalizedBaseUrl
  }
};
