import type { AuthenticatedUser } from "../../interfaces/user";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
