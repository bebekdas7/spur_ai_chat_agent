import { Router, type Request, type Response } from 'express';
import { createConversation, getConversationMessages, saveAIMessage, saveUserMessage } from '../services/chat.service';
import { ConversationNotFoundError, InvalidLLMCredentialsError, LLMRateLimitExceededError } from '../utils/error';
import { generateReply } from '../services/llm.service';
import { ChatHistoryQuerySchema, ChatMessageInput, ChatMessageSchema } from '../schema/chat.schema';
import { logger } from '../utils/logger';

const router = Router();


router.post("/message", async (req: Request, res: Response) => {
  try {
    const parseResult = ChatMessageSchema.safeParse(req.body);

    if (!parseResult.success) {
      logger.warn('Invalid chat payload received', { issues: parseResult.error.issues, ip: req.ip });
      return res.status(400).json({
        error: parseResult.error.issues[0].message,
      });
    }

    const { message, sessionId }: ChatMessageInput = parseResult.data;

    let conversationId = sessionId;

    if (!conversationId) {
      const conversation = await createConversation();
      conversationId = conversation.id;
    }

    // Save user message
    await saveUserMessage(conversationId, message);

    // Fetch history
    const history = await getConversationMessages(conversationId, 8);

    // Generate AI reply
    let reply: string;
    try {
      reply = await generateReply(history, message);
    } catch (generateError) {
      if (generateError instanceof InvalidLLMCredentialsError) {
        logger.error('LLM authentication failure detected', { conversationId });
        reply =
          "Sorry, our assistant is offline due to a configuration issue. Please try again later.";
      } else if (generateError instanceof LLMRateLimitExceededError) {
        logger.warn('LLM rate limit exceeded for conversation', { conversationId });
        reply =
          "Sorry, I need a moment to catch up. Please try again shortly.";
      } else {
        logger.error('LLM generation failed', { conversationId, err: generateError });
        reply =
          "Sorry, I'm having trouble responding right now. Please try again.";
      }
    }

    // Save AI reply
    await saveAIMessage(conversationId, reply);
    logger.info('Message processed', { conversationId });

    res.json({
      reply,
      sessionId: conversationId,
    });
  } catch (err) {
    if (err instanceof ConversationNotFoundError) {
      logger.warn('Conversation not found when saving message', { err: err.message });
      return res.status(404).json({ error: "Conversation not found" });
    }

    logger.error('Unhandled chat route error', { err });
    res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  const parseResult = ChatHistoryQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    logger.warn('Invalid history query received', { issues: parseResult.error.issues, ip: req.ip });
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }

  const { sessionId } = parseResult.data;

  try {
    const messages = await getConversationMessages(sessionId, 1000);
    logger.info('Conversation history retrieved', { conversationId: sessionId, count: messages.length });

    return res.json({
      sessionId,
      messages: messages.map((message) => ({
        id: message.id,
        sender: message.sender,
        content: message.content,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof ConversationNotFoundError) {
      logger.warn('Conversation not found when fetching history', { conversationId: sessionId });
      return res.status(404).json({ error: 'Conversation not found' });
    }

    logger.error('Unhandled chat history error', { err: error, conversationId: sessionId });
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});


export default router;
