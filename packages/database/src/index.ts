import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";

// Re-export the generated types, enums (Source, CvParseStatus), models and the
// `Prisma` namespace so consumers import everything from `@repo/database`.
export * from "./generated/prisma/client.js";

/**
 * Runtime client connects through the `pg` driver adapter using the pooled
 * `DATABASE_URL` (PgBouncer). Migrations use `DIRECT_URL` — see prisma.config.ts.
 */
const createPrismaClient = () => {
  const connectionString = process.env["DATABASE_URL"];
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

// Reuse a single client across hot-reloads in dev to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
