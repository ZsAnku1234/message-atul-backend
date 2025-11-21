import { Schema, model, type Document } from "mongoose";

export interface OtpCodeDocument extends Document {
  phoneNumber: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpCodeSchema = new Schema<OtpCodeDocument>(
  {
    phoneNumber: { type: String, required: true, index: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 }
  },
  {
    timestamps: true
  }
);

otpCodeSchema.index({ phoneNumber: 1, createdAt: -1 });
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCodeModel = model<OtpCodeDocument>("OtpCode", otpCodeSchema);
