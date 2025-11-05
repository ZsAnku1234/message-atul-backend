import createHttpError from "http-errors";
import { UserModel, type UserDocument } from "../models/User";
import { comparePassword, hashPassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";

const sanitizeUser = (user: UserDocument) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  statusMessage: user.statusMessage
});

export const registerUser = async (params: {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
}) => {
  const existing = await UserModel.findOne({ email: params.email });

  if (existing) {
    throw createHttpError(409, "Email already registered");
  }

  const user = await UserModel.create({
    email: params.email,
    displayName: params.displayName,
    avatarUrl: params.avatarUrl,
    password: await hashPassword(params.password)
  });

  const token = signAccessToken(user.id);

  return { user: sanitizeUser(user), token };
};

export const loginUser = async (params: { email: string; password: string }) => {
  const user = await UserModel.findOne({ email: params.email });

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const valid = await comparePassword(params.password, user.password);

  if (!valid) {
    throw createHttpError(401, "Invalid credentials");
  }

  const token = signAccessToken(user.id);

  return { user: sanitizeUser(user), token };
};
