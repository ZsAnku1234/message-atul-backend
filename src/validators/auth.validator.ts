import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  avatarUrl: z.string().url().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
