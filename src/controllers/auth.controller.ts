import type { Request, Response } from "express";
import { requestOtp as requestOtpService, verifyOtp as verifyOtpService } from "../services/auth.service";

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber } = req.body;
  const result = await requestOtpService({ phoneNumber });
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber, code, displayName } = req.body;
  const result = await verifyOtpService({ phoneNumber, code, displayName });
  res.json(result);
};

export const me = async (req: Request, res: Response): Promise<void> => {
  res.json({ user: req.user });
};
