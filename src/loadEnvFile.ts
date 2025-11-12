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

if (nodeEnv === 'test') {
  console.log('🧪 Loading test environment variables');
  const testEnvFile = join(process.cwd(), '.env.test');
  loadEnvFile(testEnvFile);
} else {
  // Load environment-specific config first (public values, production only)
  if (nodeEnv === 'production') {
    const envFile = join(process.cwd(), '.env.production');
    loadEnvFile(envFile);
  }

  // Load .env file with secrets and local config (overrides public config if any)
  // Required for DISCORD_TOKEN and other secrets
  const localEnvFile = join(process.cwd(), '.env');
  loadEnvFile(localEnvFile);
}
