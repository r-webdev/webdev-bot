import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Simple .env loader without external dependencies
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
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
  } catch (error) {
    console.warn(`Warning: Could not load ${filePath}`);
    console.warn('Make sure a valid .env.local file exists.');
    console.warn(error);
  }
}

// Load local environment file if it exists
loadEnvFile(join(process.cwd(), '.env.local'));
