import './loadEnvFile.js';

function optionalEnv(key: string): string | undefined {
  return process.env[key];
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Required environment variable ${key} is not set`);
    console.error('Please check your .env.local file or CI/CD configuration');
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
  repel: {
    repelLogChannelId: requireEnv('REPEL_LOG_CHANNEL_ID'),
    repelRoleId: requireEnv('REPEL_ROLE_ID'),
  },
  fetchAndSyncMessages: true,
  serverId: requireEnv('SERVER_ID'),
  moderatorsRoleIds: requireEnv('MODERATORS_ROLE_IDS')
    ? requireEnv('MODERATORS_ROLE_IDS').split(',')
    : [],
  guides: {
    channelId: requireEnv('GUIDES_CHANNEL_ID'),
    trackerPath: optionalEnv('GUIDES_TRACKER_PATH'),
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
