import { randomInt } from "crypto";
import createHttpError from "http-errors";
import { env } from "../config/env";
import { OtpCodeModel } from "../models/OtpCode";
import { UserModel, type UserDocument } from "../models/User";
import { hashSecret, verifySecret } from "../utils/password";
import { signAccessToken } from "../utils/jwt";

const OTP_TTL_MS = 1000 * 60 * 5; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

const sanitizeUser = (user: UserDocument) => ({
  id: user.id,
  phoneNumber: user.phoneNumber,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  statusMessage: user.statusMessage
});

const normalizePhoneNumber = (
  phoneNumber: string
): { normalized: string; legacy: string | null } => {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 15) {
    throw createHttpError(400, "Phone number must contain between 10 and 15 digits");
  }

  let normalizedDigits = digits;
  let legacyDigits: string | null = null;

  if (digits.length === 10) {
    normalizedDigits = `91${digits}`;
    legacyDigits = digits;
  }

  if (normalizedDigits.length > 15) {
    throw createHttpError(400, "Phone number exceeds maximum length after normalization");
  }

  return {
    normalized: `+${normalizedDigits}`,
    legacy: legacyDigits ? `+${legacyDigits}` : null
  };
};

const generateOtpCode = (): string => {
  const value = randomInt(0, 1_000_000);
  return value.toString().padStart(6, "0");
};

export const requestOtp = async (params: { phoneNumber: string }) => {
  const { normalized: normalizedPhone } = normalizePhoneNumber(params.phoneNumber);
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpCodeModel.create({
    phoneNumber: normalizedPhone,
    codeHash: await hashSecret(otpCode),
    expiresAt
  });

  return {
    phoneNumber: normalizedPhone,
    expiresAt,
    ...(env.nodeEnv !== "production" ? { code: otpCode } : {})
  };
};

export const verifyOtp = async (params: { phoneNumber: string; code: string; displayName?: string }) => {
  const { normalized: normalizedPhone, legacy } = normalizePhoneNumber(params.phoneNumber);
  const lookupPhones = legacy ? [normalizedPhone, legacy] : [normalizedPhone];
  const latestOtp = await OtpCodeModel.findOne({ phoneNumber: { $in: lookupPhones } }).sort({ createdAt: -1 });

  if (!latestOtp || latestOtp.expiresAt.getTime() < Date.now()) {
    throw createHttpError(400, "OTP expired or not found");
  }

  if (latestOtp.attempts >= MAX_OTP_ATTEMPTS) {
    throw createHttpError(429, "Too many invalid attempts. Please request a new OTP.");
  }

  const isValid = await verifySecret(params.code, latestOtp.codeHash);

  if (!isValid) {
    latestOtp.attempts += 1;
    await latestOtp.save();
    throw createHttpError(401, "Invalid OTP code");
  }

  await OtpCodeModel.deleteMany({ phoneNumber: { $in: lookupPhones } });

  let user = await UserModel.findOne({ phoneNumber: { $in: lookupPhones } });
  const aliasEmail = `${normalizedPhone.replace(/\D/g, "")}@pulse-auto.local`;
  let hasMutations = false;

  if (!user) {
    const trimmedName = params.displayName?.trim();
    const fallbackName =
      trimmedName && trimmedName.length >= 2
        ? trimmedName
        : `User ${normalizedPhone.slice(-4)}`;

    try {
      user = await UserModel.findOneAndUpdate(
        { phoneNumber: normalizedPhone },
        {
          $setOnInsert: {
            phoneNumber: normalizedPhone,
            displayName: fallbackName,
            email: aliasEmail
          }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          returnDocument: "after"
        }
      );
    } catch (error) {
      const isDuplicateKey =
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: number }).code === 11000;

      if (!isDuplicateKey) {
        throw error;
      }

      user = await UserModel.findOne({ phoneNumber: { $in: lookupPhones } });
    }
  }

  if (!user) {
    throw createHttpError(500, "Unable to resolve user profile after verification");
  }

  if (user.phoneNumber !== normalizedPhone) {
    user.phoneNumber = normalizedPhone;
    hasMutations = true;
  }

  if (!user.email) {
    user.email = aliasEmail;
    hasMutations = true;
  }

  if (params.displayName && params.displayName.trim() && user.displayName !== params.displayName.trim()) {
    user.displayName = params.displayName.trim();
    hasMutations = true;
  }

  if (hasMutations) {
    await user.save();
  }

  const token = signAccessToken(user.id);

  return { user: sanitizeUser(user), token };
};
