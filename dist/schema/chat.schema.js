"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistoryQuerySchema = exports.ChatMessageSchema = void 0;
const zod_1 = require("zod");
exports.ChatMessageSchema = zod_1.z.object({
    message: zod_1.z
        .string()
        .trim()
        .min(1, "Message cannot be empty")
        .max(500, "Message cannot exceed 500 characters"),
    sessionId: zod_1.z.string().optional(),
});
exports.ChatHistoryQuerySchema = zod_1.z.object({
    sessionId: zod_1.z.preprocess((value) => (Array.isArray(value) ? value[0] : value), zod_1.z.string().trim().min(1, "sessionId is required")),
});
//# sourceMappingURL=chat.schema.js.map