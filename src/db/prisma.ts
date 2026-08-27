import { config } from '@/env.js';
import { PrismaClient } from '@generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: config.databaseUrl });
export const prisma = new PrismaClient({ adapter });
