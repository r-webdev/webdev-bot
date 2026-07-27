import {
  REST,
  type RESTPutAPIApplicationCommandsResult,
  Routes,
} from 'discord.js';
import { commands } from '@/common/commands/index.js';
import { config } from '@/env.js';
import { pathToFileURL } from 'node:url';
console.log('Deploying commands...');
export async function deployCommands() {
  const commandData = [...commands.values()].map((command) => command.data);

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    const result = (await rest.put(
      Routes.applicationGuildCommands(
        config.discord.clientId,
        config.discord.serverId
      ),
      {
        body: commandData,
      }
    )) as RESTPutAPIApplicationCommandsResult;
    console.log(
      `✅ Successfully deployed ${result.length} commands to guild ${config.discord.serverId}`
    );
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

// If run directly with `node deploy.ts`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await deployCommands();
}
