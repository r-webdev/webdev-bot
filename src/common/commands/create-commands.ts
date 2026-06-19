import { ApplicationCommandType } from 'discord.js';
import type {
  MessageContextMenuCommand,
  SlashCommand,
  UserContextMenuCommand,
} from './types.js';

export const createSlashCommand = (command: {
  data: Omit<SlashCommand['data'], 'type'>;
  execute: SlashCommand['execute'];
}): SlashCommand => {
  return {
    commandType: ApplicationCommandType.ChatInput,
    data: {
      ...command.data,
      type: ApplicationCommandType.ChatInput,
    },
    execute: command.execute,
  };
};

export const createUserContextMenuCommand = (command: {
  data: Omit<UserContextMenuCommand['data'], 'type'>;
  execute: UserContextMenuCommand['execute'];
}): UserContextMenuCommand => {
  return {
    commandType: ApplicationCommandType.User,
    data: {
      ...command.data,
      type: ApplicationCommandType.User,
    },
    execute: command.execute,
  };
};

export const createMessageContextMenuCommand = (command: {
  data: Omit<MessageContextMenuCommand['data'], 'type'>;
  execute: MessageContextMenuCommand['execute'];
}): MessageContextMenuCommand => {
  return {
    commandType: ApplicationCommandType.Message,
    data: {
      ...command.data,
      type: ApplicationCommandType.Message,
    },
    execute: command.execute,
  };
};
