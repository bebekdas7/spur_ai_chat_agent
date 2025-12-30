"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_service_1 = require("../services/chat.service");
const error_1 = require("../utils/error");
const llm_service_1 = require("../services/llm.service");
const chat_schema_1 = require("../schema/chat.schema");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post("/message", async (req, res) => {
    try {
        const parseResult = chat_schema_1.ChatMessageSchema.safeParse(req.body);
        if (!parseResult.success) {
            logger_1.logger.warn('Invalid chat payload received', { issues: parseResult.error.issues, ip: req.ip });
            return res.status(400).json({
                error: parseResult.error.issues[0].message,
            });
        }
        const { message, sessionId } = parseResult.data;
        let conversationId = sessionId;
        if (!conversationId) {
            const conversation = await (0, chat_service_1.createConversation)();
            conversationId = conversation.id;
        }
        // Save user message
        await (0, chat_service_1.saveUserMessage)(conversationId, message);
        // Fetch history
        const history = await (0, chat_service_1.getConversationMessages)(conversationId, 8);
        // Generate AI reply
        let reply;
        try {
            reply = await (0, llm_service_1.generateReply)(history, message);
        }
        catch (generateError) {
            if (generateError instanceof error_1.InvalidLLMCredentialsError) {
                logger_1.logger.error('LLM authentication failure detected', { conversationId });
                reply =
                    "Sorry, our assistant is offline due to a configuration issue. Please try again later.";
            }
            else if (generateError instanceof error_1.LLMRateLimitExceededError) {
                logger_1.logger.warn('LLM rate limit exceeded for conversation', { conversationId });
                reply =
                    "Sorry, I need a moment to catch up. Please try again shortly.";
            }
            else {
                logger_1.logger.error('LLM generation failed', { conversationId, err: generateError });
                reply =
                    "Sorry, I'm having trouble responding right now. Please try again.";
            }
        }
        // Save AI reply
        await (0, chat_service_1.saveAIMessage)(conversationId, reply);
        logger_1.logger.info('Message processed', { conversationId });
        res.json({
            reply,
            sessionId: conversationId,
        });
    }
    catch (err) {
        if (err instanceof error_1.ConversationNotFoundError) {
            logger_1.logger.warn('Conversation not found when saving message', { err: err.message });
            return res.status(404).json({ error: "Conversation not found" });
        }
        logger_1.logger.error('Unhandled chat route error', { err });
        res.status(500).json({
            error: "Something went wrong. Please try again.",
        });
    }
});
router.get('/history', async (req, res) => {
    const parseResult = chat_schema_1.ChatHistoryQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
        logger_1.logger.warn('Invalid history query received', { issues: parseResult.error.issues, ip: req.ip });
        return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { sessionId } = parseResult.data;
    try {
        const messages = await (0, chat_service_1.getConversationMessages)(sessionId, 1000);
        logger_1.logger.info('Conversation history retrieved', { conversationId: sessionId, count: messages.length });
        return res.json({
            sessionId,
            messages: messages.map((message) => ({
                id: message.id,
                sender: message.sender,
                content: message.content,
                createdAt: message.createdAt,
            })),
        });
    }
    catch (error) {
        if (error instanceof error_1.ConversationNotFoundError) {
            logger_1.logger.warn('Conversation not found when fetching history', { conversationId: sessionId });
            return res.status(404).json({ error: 'Conversation not found' });
        }
        logger_1.logger.error('Unhandled chat history error', { err: error, conversationId: sessionId });
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});
exports.default = router;
//# sourceMappingURL=chat.routes.js.map