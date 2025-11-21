import type { Request, Response } from "express";
import { searchUsers } from "../services/user.service";

export const search = async (req: Request, res: Response): Promise<void> => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const results = await searchUsers(req.user!.id, query);
  res.json({ users: results });
};
