import { Schema, model, type Document } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  displayName: string;
  avatarUrl?: string;
  password: string;
  statusMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    password: { type: String, required: true },
    statusMessage: { type: String }
  },
  {
    timestamps: true
  }
);

export const UserModel = model<UserDocument>("User", userSchema);
