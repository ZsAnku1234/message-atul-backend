import { z } from "zod";

export const createConversationSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1)
});
