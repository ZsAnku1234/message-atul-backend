import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET should be at least 32 characters"),
  CLIENT_ORIGIN: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: Number(parsed.data.PORT),
  mongoUri: parsed.data.MONGO_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  clientOrigin: parsed.data.CLIENT_ORIGIN
};
