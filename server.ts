import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import chatRouter from './routes/chat.routes';
import { logger } from './utils/logger';
import { ConversationNotFoundError } from './utils/error';

dotenv.config();

const app = express();

const corsOriginEnv = process.env.CORS_ORIGINS;
const allowedOrigins = corsOriginEnv
  ?.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const fallbackOrigins = [
  process.env.DEFAULT_WEB_ORIGIN ?? 'http://localhost:3000',
  process.env.DEFAULT_ADMIN_ORIGIN ?? 'http://localhost:5173',
].filter((origin) => origin && origin.length > 0);

const corsOrigins = allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : fallbackOrigins;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(express.json());
const port: number = process.env.PORT ? Number(process.env.PORT) : 3000;
const appVersion: string | undefined = process.env.APP_VERSION;

type HealthResponse = {
  status: 'healthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string | null;
};

app.get('/health', (_req: Request, res: Response) => {
  const payload: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    environment: process.env.NODE_ENV ?? 'development',
    version: appVersion ?? null,
  };

  res.status(200).json(payload);
});

app.use('/chat', chatRouter);

// global erorr handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error) {
    logger.error('Unhandled error', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.error('Unhandled error', {
      details: err,
    });
  }

  if (err instanceof ConversationNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  logger.info('Server listening', { port, environment: process.env.NODE_ENV ?? 'development' });
});
