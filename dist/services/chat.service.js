"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.saveUserMessage = saveUserMessage;
exports.saveAIMessage = saveAIMessage;
exports.getConversationMessages = getConversationMessages;
const enums_1 = require("../generated/client/enums");
const prisma_1 = require("../db/prisma");
const error_1 = require("../utils/error");
async function createConversation() {
    return prisma_1.prisma.conversation.create({
        data: {
            channel: "web", // optional, future-ready
        },
    });
}
async function requireConversation(conversationId) {
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation) {
        throw new error_1.ConversationNotFoundError(conversationId);
    }
    return conversation;
}
async function saveUserMessage(conversationId, content) {
    await requireConversation(conversationId);
    return prisma_1.prisma.message.create({
        data: {
            conversationId,
            sender: enums_1.Sender.user,
            content,
        },
    });
}
async function saveAIMessage(conversationId, content) {
    await requireConversation(conversationId);
    return prisma_1.prisma.message.create({
        data: {
            conversationId,
            sender: enums_1.Sender.ai,
            content,
        },
    });
}
async function getConversationMessages(conversationId, limit) {
    await requireConversation(conversationId);
    const recentMessages = await prisma_1.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        ...(typeof limit === "number" ? { take: limit } : {}),
    });
    return recentMessages.reverse();
}
//# sourceMappingURL=chat.service.js.map