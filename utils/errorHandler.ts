import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger';
import { ConversationNotFoundError } from './error';

export function globalErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
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
}
