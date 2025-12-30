export class ConversationNotFoundError extends Error {
  constructor(conversationId: string) {
    super(`Conversation not found: ${conversationId}`);
    this.name = "ConversationNotFoundError";
  }
}

export class InvalidLLMCredentialsError extends Error {
  constructor() {
    super("Invalid LLM credentials provided");
    this.name = "InvalidLLMCredentialsError";
  }
}

export class LLMRateLimitExceededError extends Error {
  constructor() {
    super("LLM rate limit exceeded");
    this.name = "LLMRateLimitExceededError";
  }
}
