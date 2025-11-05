import mongoose from "mongoose";
import { env } from "./env";

export const connectMongo = async (): Promise<typeof mongoose> => {
  mongoose.set("strictQuery", true);

  try {
    const connection = await mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== "production"
    });
    return connection;
  } catch (error) {
    console.error("Mongo connection error", error);
    throw error;
  }
};
