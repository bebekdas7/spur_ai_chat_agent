import { z } from "zod";

export const ChatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message cannot exceed 500 characters"),
  sessionId: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export const ChatHistoryQuerySchema = z.object({
  sessionId: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().trim().min(1, "sessionId is required")
  ),
});
