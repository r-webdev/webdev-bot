import { REST, Routes } from 'discord.js';
import { config } from './src/env.js';

const main = async () => {
  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  await rest.put(Routes.applicationCommands(config.discord.clientId), { body: [] });
};
main();
