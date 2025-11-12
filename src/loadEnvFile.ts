import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Simple .env loader without external dependencies
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    console.warn(`Warning: File ${filePath} not found`);
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
    console.log(`✅ Loaded: ${filePath}`);
  } catch (error) {
    console.warn(`Warning: Could not load ${filePath}`);
    console.warn(error);
  }
}

// Determine environment (defaults to development)
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`🌍 Environment: ${nodeEnv}`);

const ENV_FILES = {
  test: join(process.cwd(), '.env.test'),
  production: join(process.cwd(), '.env.production'),
  development: join(process.cwd(), '.env'),
};

const envFile = ENV_FILES[nodeEnv as keyof typeof ENV_FILES];
if (envFile) {
  loadEnvFile(envFile);
} else {
  console.error(`❌ Environment file ${nodeEnv} not found`);
  process.exit(1);
}
