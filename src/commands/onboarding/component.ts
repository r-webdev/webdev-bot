import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  type MessageActionRowComponentBuilder,
} from 'discord.js';

const containerComponent = new ContainerBuilder();

const actionRowComponent = new ActionRowBuilder<MessageActionRowComponentBuilder>();

const buttonComponent = new ButtonBuilder()
  .setCustomId('onboarding_add_role')
  .setLabel('Add role')
  .setStyle(ButtonStyle.Primary);

actionRowComponent.addComponents(buttonComponent);
containerComponent.addActionRowComponents(actionRowComponent);

export { containerComponent };
