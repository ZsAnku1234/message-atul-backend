import { Schema, model, Types, type Document } from "mongoose";

export interface ConversationDocument extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  title?: string;
  isGroup: boolean;
  isPrivate: boolean;
  admins: Types.ObjectId[];
  adminOnlyMessaging: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date },
    title: { type: String, trim: true },
    isGroup: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    admins: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    adminOnlyMessaging: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ createdBy: 1 });

export const ConversationModel = model<ConversationDocument>("Conversation", conversationSchema);
