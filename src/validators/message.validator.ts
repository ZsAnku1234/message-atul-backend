import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  attachments: z.array(z.string().url()).optional()
});
