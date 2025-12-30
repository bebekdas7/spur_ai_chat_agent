"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReply = generateReply;
const openai_1 = __importDefault(require("openai"));
const error_1 = require("openai/error");
const error_2 = require("../utils/error");
const logger_1 = require("../utils/logger");
const requestTimeoutMs = (() => {
    const raw = process.env.OPENAI_TIMEOUT_MS;
    const parsed = raw ? Number(raw) : undefined;
    if (parsed && parsed > 0) {
        return parsed;
    }
    return 15000;
})();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
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
let requestLog = [];
function enforceRateLimit() {
    if (!maxRequestsPerMinute) {
        return;
    }
    const now = Date.now();
    const windowMs = 60000;
    requestLog = requestLog.filter((timestamp) => now - timestamp < windowMs);
    if (requestLog.length >= maxRequestsPerMinute) {
        throw new error_2.LLMRateLimitExceededError();
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
async function generateReply(history, userMessage) {
    try {
        enforceRateLimit();
        // history arrives sorted by createdAt ascending from chat.service
        const recentHistory = history.slice(-8);
        const historyMessages = recentHistory.map((msg) => {
            const role = msg.sender === "user" ? "user" : "assistant";
            return { role, content: msg.content };
        });
        const messages = [
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
        return (response.choices[0]?.message?.content ||
            "Sorry, I couldn’t generate a response.");
    }
    catch (error) {
        if (error instanceof error_2.LLMRateLimitExceededError) {
            logger_1.logger.warn("Local LLM rate limit reached", { maxRequestsPerMinute });
            throw error;
        }
        if (error instanceof error_1.APIError && error.status === 401) {
            logger_1.logger.error("LLM authentication failed; verify OpenAI API key", { err: error });
            throw new error_2.InvalidLLMCredentialsError();
        }
        logger_1.logger.error("LLM provider failure", { err: error });
        throw new Error("LLM_FAILED");
    }
}
//# sourceMappingURL=llm.service.js.map