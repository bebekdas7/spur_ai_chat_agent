# Spur Backend

Server-side portion of the Spur take-home. Provides chat persistence, LLM proxying, and health instrumentation.

## Run Locally (Step-by-Step)

1. Install Node.js 20+ and ensure npm 10+ is available.
2. Install and start a PostgreSQL 14+ instance; capture its connection string.
3. Copy .env.example to .env and populate the variables described below.
4. Install dependencies: `npm install`.
5. Apply database migrations: `npx prisma migrate deploy`.
6. Launch the development server: `npm run dev` (listens on the configured PORT, default 3000).
7. For a production-like build, run `npm run build` followed by `npm start` after step 5.

## Database Setup (Migrations & Seed)

- Prisma manages the schema defined in prisma/schema.prisma.
- `npx prisma migrate deploy` applies committed migrations to the database specified by DATABASE_URL.
- A seeding script is not yet implemented;

## Environment Variables

| Variable                       | Purpose                                           | Default                                     |
| ------------------------------ | ------------------------------------------------- | ------------------------------------------- |
| DATABASE_URL                   | PostgreSQL connection string used by Prisma       | none (required)                             |
| OPENAI_API_KEY                 | Credential for the OpenAI Chat Completions API    | none (required)                             |
| OPENAI_TIMEOUT_MS              | Request timeout applied to each LLM call          | 15000                                       |
| PORT                           | HTTP port for the Express server                  | 3000                                        |
| LOG_LEVEL                      | Winston log level                                 | info                                        |
| LOG_DIR                        | Directory for persisted logs                      | logs                                        |
| CORS_ORIGINS                   | Comma-separated allowlist for CORS                | http://localhost:3000,http://localhost:4000 |
| APP_VERSION                    | Optional tag surfaced by the health endpoint      | unset                                       |
| OPENAI_MAX_REQUESTS_PER_MINUTE | In-memory throttle for outbound LLM calls         | 60 (set 0/blank to disable)                 |

## Architecture Overview

- Express entry point in [server.ts](server.ts) wires middleware, health routing, and chat routing.
- Request validation resides in [schema/chat.schema.ts](schema/chat.schema.ts) using Zod to guard inputs before reaching business logic.
- Route orchestration in [routes/chat.routes.ts](routes/chat.routes.ts) coordinates validation, persistence, and LLM calls.
- Persistence logic lives in [services/chat.service.ts](services/chat.service.ts) and the shared Prisma client at [db/prisma.ts](db/prisma.ts).
- LLM orchestration is isolated in [services/llm.service.ts](services/llm.service.ts) to keep provider-specific details out of routing.
- Cross-cutting helpers (logger, errors) sit under [utils](utils).
- Design decisions: kept a thin Express layer with service modules to enable future replacement with Fastify or serverless handlers; centralized Prisma access to avoid client duplication; used Zod schemas once at the edge to share validation across REST and potential future websocket endpoints.

## LLM Notes

- Provider: OpenAI Chat Completions API targeting the gpt-4o-mini model.
- Prompting: deterministic system prompt that describes Spur's shipping, return, refund, and support policies; user question plus the last eight message pairs form the conversational context.
- Error strategy: wraps provider exceptions, logs structured diagnostics, and returns a user-friendly fallback message while preserving the conversation record; honors OPENAI_TIMEOUT_MS for network ceilings and surfaces a configuration warning when credentials are invalid.
- Rate limiting: process-scoped in-memory counter governed by OPENAI_MAX_REQUESTS_PER_MINUTE; migrate to a shared store such as Redis to enforce limits across instances in production.

## Trade-offs & If I Had More Time

- Trade-offs: Only per-process rate limiting today; shared distributed throttling and queuing are deferred.
- Trade-offs: Message history replay is naive (full replay each call), which may increase latency for long sessions.
- If more time: Add integration tests with a mocked LLM and disposable Postgres schema.
- If more time: Implement seeding and scripted fixtures for local development.
- If more time: Add summarization or pagination for long conversation history and introduce request throttling around the LLM.
