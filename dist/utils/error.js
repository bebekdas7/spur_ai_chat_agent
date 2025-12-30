"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMRateLimitExceededError = exports.InvalidLLMCredentialsError = exports.ConversationNotFoundError = void 0;
class ConversationNotFoundError extends Error {
    constructor(conversationId) {
        super(`Conversation not found: ${conversationId}`);
        this.name = "ConversationNotFoundError";
    }
}
exports.ConversationNotFoundError = ConversationNotFoundError;
class InvalidLLMCredentialsError extends Error {
    constructor() {
        super("Invalid LLM credentials provided");
        this.name = "InvalidLLMCredentialsError";
    }
}
exports.InvalidLLMCredentialsError = InvalidLLMCredentialsError;
class LLMRateLimitExceededError extends Error {
    constructor() {
        super("LLM rate limit exceeded");
        this.name = "LLMRateLimitExceededError";
    }
}
exports.LLMRateLimitExceededError = LLMRateLimitExceededError;
//# sourceMappingURL=error.js.map