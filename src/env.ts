import './loadEnvFile.js';

function optionalEnv(key: string): string | undefined {
  return process.env[key];
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Required environment variable ${key} is not set`);
    console.error('Please check your .env file or CI/CD configuration');
    process.exit(1);
  }
  return value;
}

// Single source of truth for all configuration
export const config = {
  discord: {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: requireEnv('CLIENT_ID'),
  },
  serverId: requireEnv('SERVER_ID'),
  fetchAndSyncMessages: true,
  guidesTrackerPath: optionalEnv('GUIDES_TRACKER_PATH'),
  adventOfCodeTrackerPath: requireEnv('ADVENT_OF_CODE_TRACKER_PATH'),
  roleIds: {
    moderators: requireEnv('MODERATORS_ROLE_IDS')
      ? requireEnv('MODERATORS_ROLE_IDS').split(',')
      : [],
    repel: requireEnv('REPEL_ROLE_ID'),
    regular: requireEnv('REGULAR_ROLE_ID'),
    a: optionalEnv('ROLE_A_ID'),
    b: optionalEnv('ROLE_B_ID'),
    c: optionalEnv('ROLE_C_ID'),
  },
  channelIds: {
    repelLogs: requireEnv('REPEL_LOG_CHANNEL_ID'),
    guides: requireEnv('GUIDES_CHANNEL_ID'),
    adventOfCode: requireEnv('ADVENT_OF_CODE_CHANNEL_ID'),
  },
  onboarding: {
    channelId: optionalEnv('ONBOARDING_CHANNEL_ID'),
    roleId: optionalEnv('ONBOARDING_ROLE_ID'),
  },
  // Add more config sections as needed:
  // database: {
  //   url: requireEnv('DATABASE_URL'),
  // },
  // api: {
  //   openaiKey: optionalEnv('OPENAI_API_KEY'),
  // },
};

export type Config = typeof config;

// Log loaded configuration (without sensitive values)
console.log('✅ Configuration loaded successfully');
console.log(`📋 Client ID: ${config.discord.clientId ? config.discord.clientId : '❌ missing'}`);
console.log(`🔑 Token: ${config.discord.token ? '***configured***' : '❌ missing'}`);
