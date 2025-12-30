# Backend TODO

## Project Setup

- Add README section describing backend run instructions and environment variables.
- Introduce linting/formatting (ESLint + Prettier) and ensure scripts exist for checks.
- Configure ts-node/ts-node-dev or build pipeline for production-ready start command.

## Configuration & Secrets

- Document required env vars (PORT, DATABASE_URL, OPENAI_API_KEY, optional APP_VERSION).
- Add config loader utility that validates env vars and centralizes defaults.

## API Layer

- Implement POST /chat/message route that validates payload (message text, optional sessionId).
- Return { reply, sessionId } shape with proper HTTP status codes and error responses.
- Add GET /health and GET /chat/:sessionId endpoints for monitoring and history retrieval.

## Services & LLM Integration

- Create chat service that orchestrates persistence + LLM call.
- Build generateReply(history, userMessage) helper wrapping chosen LLM SDK.
- Inject system prompt covering FAQ (shipping, returns, support hours) and handle API errors gracefully.

## Persistence

- Define conversation and message models (id, timestamps, sender, text, session linkage).
- Choose ORM (Prisma, Drizzle, or Knex) and set up migrations.
- Implement repository layer to store/load conversations and message history.

## Robustness & Validation

- Reject empty or overly long messages and surface validation errors.
- Add error middleware translating thrown errors into JSON payloads.
- Include logging for request lifecycle and LLM failures.

## Testing & Tooling

- Add unit tests for chat service and health endpoint (Vitest/Jest).
- Provide integration test hitting POST /chat/message with mocked LLM.
- Set up npm scripts for test and coverage reporting.
