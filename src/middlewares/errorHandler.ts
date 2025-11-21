import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  void _next;
  if (err instanceof ZodError) {
    res.status(422).json({
      message: "Validation failed",
      errors: err.flatten()
    });
    return;
  }

  const status = err.status ?? 500;
  const message = status === 500 ? "Internal server error" : err.message;

  if (status === 500) {
    console.error("Unhandled error:", err);
  }

  res.status(status).json({ message });
};
