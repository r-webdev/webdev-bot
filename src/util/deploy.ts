import { REST, type RESTPutAPIApplicationCommandsResult, Routes } from 'discord.js';
import { commands } from '../commands/index.js';
import { config } from '../env.js';

export async function deployCommands(): Promise<RESTPutAPIApplicationCommandsResult> {
  const commandData = [...commands.values()].map((command) => command.data);

  const guildId = config.discord.serverId;

  const rest = new REST({ version: '10' }).setToken(config.discord.token);


  const result = (await rest.put(
    Routes.applicationGuildCommands(config.discord.clientId, config.serverId),
    {
      body: commandData,
    }
  )) as RESTPutAPIApplicationCommandsResult;

  console.log(`Successfully registered ${result.length} commands.`);
  return result;
}

// If run directly with `node deploy.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCommands();
}
