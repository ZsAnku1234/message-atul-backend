import createHttpError from "http-errors";
import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UserModel } from "../models/User";

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(createHttpError(401, "Missing authorization header"));
    return;
  }

  try {
    const token = header.replace("Bearer ", "");
    const payload = verifyToken(token);
    const user = await UserModel.findById(payload.sub);

    if (!user) {
      next(createHttpError(401, "User not found"));
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    };

    next();
  } catch {
    next(createHttpError(401, "Invalid token"));
  }
};
