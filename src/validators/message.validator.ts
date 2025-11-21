import { z } from "zod";
import { env } from "../config/env";

const attachmentArray = z.array(z.string().url()).max(env.media.maxAttachmentCount).optional();

export const messageContentSchema = z.object({
  content: z.string().optional(),
  attachments: attachmentArray
});

export const sendMessageSchema = messageContentSchema.extend({
  conversationId: z.string().min(1)
});

export const updateMessageSchema = messageContentSchema;
