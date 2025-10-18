import { API } from '@discordjs/core/http-only';
import {
  REST,
  type RESTPutAPIApplicationCommandsResult,
  type RESTPutAPIApplicationGuildCommandsJSONBody,
} from 'discord.js';
import { commands } from '../commands/index.js';
import { config } from '../env.js';

export async function deployCommands(): Promise<RESTPutAPIApplicationCommandsResult> {
  const commandData = [...commands.values()].map((command) => command.data);

  const guildId = config.discord.serverId;

  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  const api = new API(rest);

  let result: RESTPutAPIApplicationCommandsResult;

  if (guildId) {
    result = await api.applicationCommands.bulkOverwriteGuildCommands(
      config.discord.clientId,
      guildId,
      commandData as RESTPutAPIApplicationGuildCommandsJSONBody
    );
  } else {
    result = await api.applicationCommands.bulkOverwriteGlobalCommands(
      config.discord.clientId,
      commandData
    );
  }

  console.log(`Successfully registered ${result.length} commands.`);
  return result;
}

// If run directly with `node deploy.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCommands();
}
