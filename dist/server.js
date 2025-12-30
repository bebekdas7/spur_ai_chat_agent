"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const logger_1 = require("./utils/logger");
const error_1 = require("./utils/error");
dotenv_1.default.config();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const appVersion = process.env.APP_VERSION;
app.get('/health', (_req, res) => {
    const payload = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: process.uptime(),
        environment: process.env.NODE_ENV ?? 'development',
        version: appVersion ?? null,
    };
    res.status(200).json(payload);
});
app.use('/chat', chat_routes_1.default);
// global erorr handler
app.use((err, _req, res, _next) => {
    if (err instanceof Error) {
        logger_1.logger.error('Unhandled error', {
            name: err.name,
            message: err.message,
            stack: err.stack,
        });
    }
    else {
        logger_1.logger.error('Unhandled error', {
            details: err,
        });
    }
    if (err instanceof error_1.ConversationNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
    }
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(port, () => {
    logger_1.logger.info('Server listening', { port, environment: process.env.NODE_ENV ?? 'development' });
});
//# sourceMappingURL=server.js.map