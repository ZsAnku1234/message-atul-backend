import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import routes from "./routes/index";
import { httpLogger } from "./utils/logger";
import { errorHandler } from "./middlewares/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);
  app.use("/uploads", express.static(env.media.uploadDir));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};
