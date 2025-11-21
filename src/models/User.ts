import { Schema, model, type Document } from "mongoose";

export interface UserDocument extends Document {
  phoneNumber: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string;
  statusMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    avatarUrl: { type: String },
    statusMessage: { type: String }
  },
  {
    timestamps: true
  }
);

export const UserModel = model<UserDocument>("User", userSchema);
