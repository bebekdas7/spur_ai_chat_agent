import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { APIError } from "openai/error";
import type { MessageModel } from "../generated/client/models/Message";
import { InvalidLLMCredentialsError, LLMRateLimitExceededError } from "../utils/error";
import { logger } from "../utils/logger";

const requestTimeoutMs = (() => {
  const raw = process.env.OPENAI_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : undefined;
  if (parsed && parsed > 0) {
    return parsed;
  }
  return 15000;
})();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  timeout: requestTimeoutMs,
});

const maxRequestsPerMinute = (() => {
  const raw = process.env.OPENAI_MAX_REQUESTS_PER_MINUTE;
  if (!raw) {
    return 60;
  }
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return undefined;
})();

let requestLog: number[] = [];

function enforceRateLimit() {
  if (!maxRequestsPerMinute) {
    return;
  }

  const now = Date.now();
  const windowMs = 60_000;
  requestLog = requestLog.filter((timestamp) => now - timestamp < windowMs);

  if (requestLog.length >= maxRequestsPerMinute) {
    throw new LLMRateLimitExceededError();
  }

  requestLog.push(now);
}

const SYSTEM_PROMPT = `
You are a helpful customer support agent for a small e-commerce store.

Store information:
- Shipping: Ships to India and USA. Delivery in 5–7 business days.
- Returns: 7-day no-questions-asked return policy.
- Refunds: Processed within 3–5 business days.
- Support hours: Monday to Friday, 10am–6pm IST.

Answer clearly, politely, and concisely.
If you are unsure, say you don’t know.
`;

export async function generateReply(
  history: MessageModel[],
  userMessage: string
): Promise<string> {
  try {
    enforceRateLimit();

    // history arrives sorted by createdAt ascending from chat.service
    const recentHistory = history.slice(-8);

    const historyMessages: ChatCompletionMessageParam[] = recentHistory.map((msg) => {
      const role: "user" | "assistant" = msg.sender === "user" ? "user" : "assistant";
      return { role, content: msg.content };
    });

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 300,
    });

    return (
      response.choices[0]?.message?.content ||
      "Sorry, I couldn’t generate a response."
    );
  } catch (error) {
    if (error instanceof LLMRateLimitExceededError) {
      logger.warn("Local LLM rate limit reached", { maxRequestsPerMinute });
      throw error;
    }

    if (error instanceof APIError && error.status === 401) {
      logger.error("LLM authentication failed; verify OpenAI API key", { err: error });
      throw new InvalidLLMCredentialsError();
    }

    logger.error("LLM provider failure", { err: error });
    throw new Error("LLM_FAILED");
  }
}
