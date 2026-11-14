import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from '@/util/logger.js';

const logger = createLogger('env');

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    logger.warn(`Warning: File ${filePath} not found`);
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          // Only set if not already set (allows CI/CD to override)
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value.trim();
          }
        }
      }
    }
    logger.log(`✅ Loaded: ${filePath}`);
  } catch (error) {
    logger.warn(`Warning: Could not load ${filePath}`);
    logger.warn(error);
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';
logger.log(`🌍 Environment: ${nodeEnv}`);

const ENV_FILES = {
  test: join(process.cwd(), '.env.test'),
  production: join(process.cwd(), '.env.production'),
  development: join(process.cwd(), '.env'),
};

const envFile = ENV_FILES[nodeEnv as keyof typeof ENV_FILES];
if (envFile) {
  loadEnvFile(envFile);
} else {
  logger.error(`❌ Environment file ${nodeEnv} not found`);
  process.exit(1);
}
