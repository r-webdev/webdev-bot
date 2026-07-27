import {
  REST,
  type RESTPutAPIApplicationCommandsResult,
  Routes,
} from 'discord.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { commands } from '@/common/commands/index.js';
import { config } from '@/env.js';

export async function deployCommands(): Promise<void> {
  console.log('Starting command deployment...');

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
    process.exitCode = 1;
  }
}

const entryFile = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (import.meta.url === entryFile) {
  void deployCommands();
}
