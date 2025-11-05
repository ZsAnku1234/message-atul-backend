"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.string().default("5000"),
    MONGO_URI: zod_1.z.string().min(1, "MONGO_URI is required"),
    JWT_SECRET: zod_1.z.string().min(32, "JWT_SECRET should be at least 32 characters"),
    CLIENT_ORIGIN: zod_1.z.string().optional()
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Environment validation failed");
}
exports.env = {
    nodeEnv: parsed.data.NODE_ENV,
    port: Number(parsed.data.PORT),
    mongoUri: parsed.data.MONGO_URI,
    jwtSecret: parsed.data.JWT_SECRET,
    clientOrigin: parsed.data.CLIENT_ORIGIN
};
