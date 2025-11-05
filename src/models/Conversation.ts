import { Schema, model, Types, type Document } from "mongoose";

export interface ConversationDocument extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const ConversationModel = model<ConversationDocument>("Conversation", conversationSchema);
