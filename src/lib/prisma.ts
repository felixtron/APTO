import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DB_CONNECTION_TIMEOUT_MS = 5_000;

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Fail fast instead of hanging requests when the DB is unreachable
    connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
  });
  return new PrismaClient({ adapter });
}

// Cache in every environment: route handlers and server components can load
// this module in separate bundle layers, which would otherwise open one
// connection pool each.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
