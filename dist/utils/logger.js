"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const winston_1 = require("winston");
const { combine, timestamp, errors, splat, json, colorize, printf } = winston_1.format;
const devFormat = combine(colorize(), timestamp(), splat(), errors({ stack: true }), printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return stack ? `${ts} [${level}] ${message}\n${stack}${metaString}` : `${ts} [${level}] ${message}${metaString}`;
}));
const prodFormat = combine(timestamp(), splat(), errors({ stack: true }), json());
const logDir = process.env.LOG_DIR ?? "logs";
if (!node_fs_1.default.existsSync(logDir)) {
    node_fs_1.default.mkdirSync(logDir, { recursive: true });
}
exports.logger = (0, winston_1.createLogger)({
    level: process.env.LOG_LEVEL ?? "info",
    format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
    defaultMeta: { service: "spur-backend" },
    transports: [
        new winston_1.transports.Console({
            handleExceptions: true,
        }),
        new winston_1.transports.File({
            filename: node_path_1.default.join(logDir, "app.log"),
            handleExceptions: true,
        }),
        new winston_1.transports.File({
            filename: node_path_1.default.join(logDir, "error.log"),
            level: "error",
            handleExceptions: true,
        }),
    ],
    exitOnError: false,
});
//# sourceMappingURL=logger.js.map