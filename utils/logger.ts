import fs from "node:fs";
import path from "node:path";
import { createLogger, format, transports } from "winston";

const { combine, timestamp, errors, splat, json, colorize, printf } = format;

const devFormat = combine(
  colorize(),
  timestamp(),
  splat(),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return stack ? `${ts} [${level}] ${message}\n${stack}${metaString}` : `${ts} [${level}] ${message}${metaString}`;
  })
);

const prodFormat = combine(timestamp(), splat(), errors({ stack: true }), json());

const logDir = process.env.LOG_DIR ?? "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  defaultMeta: { service: "spur-backend" },
  transports: [
    new transports.Console({
      handleExceptions: true,
    }),
    new transports.File({
      filename: path.join(logDir, "app.log"),
      handleExceptions: true,
    }),
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

export type Logger = typeof logger;
