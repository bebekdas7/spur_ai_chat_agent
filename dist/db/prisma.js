"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/client/client");
const globalForPrisma = globalThis;
const logLevels = process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];
const datasourceUrl = process.env.DATABASE_URL;
if (!datasourceUrl) {
    throw new Error("DATABASE_URL environment variable is required to initialize PrismaClient.");
}
const adapter = globalForPrisma.prismaAdapter ?? new adapter_pg_1.PrismaPg({
    connectionString: datasourceUrl,
});
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter,
        log: logLevels,
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
    globalForPrisma.prismaAdapter = adapter;
}
//# sourceMappingURL=prisma.js.map