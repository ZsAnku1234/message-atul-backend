import { Schema, model, Types, type Document } from "mongoose";

export interface MessageDocument extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      default: "",
      required(this: MessageDocument) {
        return !(Array.isArray(this.attachments) && this.attachments.length > 0);
      }
    },
    attachments: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export const MessageModel = model<MessageDocument>("Message", messageSchema);
