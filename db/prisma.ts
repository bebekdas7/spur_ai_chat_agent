import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/client/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
};

const logLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("DATABASE_URL environment variable is required to initialize PrismaClient.");
}

const adapter = globalForPrisma.prismaAdapter ?? new PrismaPg({
  connectionString: datasourceUrl,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}
