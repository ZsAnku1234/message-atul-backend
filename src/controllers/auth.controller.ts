import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, displayName, avatarUrl } = req.body;
  const result = await registerUser({ email, password, displayName, avatarUrl });
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });
  res.json(result);
};

export const me = async (req: Request, res: Response): Promise<void> => {
  res.json({ user: req.user });
};
