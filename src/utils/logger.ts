import morgan from "morgan";
import { env } from "../config/env";

const format = env.nodeEnv === "production" ? "combined" : "dev";

export const httpLogger = morgan(format);
