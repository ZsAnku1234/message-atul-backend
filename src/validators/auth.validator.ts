import { z } from "zod";

const phoneNumberSchema = z
  .string()
  .min(10, "Phone number must contain at least 10 digits")
  .max(20, "Phone number is too long")
  .regex(/^[\d+\-\s()]+$/, "Phone number contains invalid characters");

export const requestOtpSchema = z.object({
  phoneNumber: phoneNumberSchema
});

export const loginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z
    .string()
    .regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  displayName: z
    .string()
    .min(2, "Display name must contain at least 2 characters")
    .max(64, "Display name is too long")
    .optional()
});
