import { z } from "zod";

export const createConversationSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1),
  title: z.string().min(1).max(120).optional(),
  isPrivate: z.boolean().optional()
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(120).optional()
});

export const modifyParticipantsSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1)
});

export const updateAdminsSchema = z.object({
  add: z.array(z.string().min(1)).optional(),
  remove: z.array(z.string().min(1)).optional()
});

export const messageControlSchema = z.object({
  adminOnlyMessaging: z.boolean()
});
