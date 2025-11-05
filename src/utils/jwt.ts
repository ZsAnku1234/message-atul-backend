import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface TokenPayload {
  sub: string;
}

export const signAccessToken = (userId: string): string => {
  const payload: TokenPayload = { sub: userId };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
};
