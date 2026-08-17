import {
  Colors,
  ContainerBuilder,
  type InteractionReplyOptions,
  type RGBTuple,
  TextDisplayBuilder,
} from 'discord.js';

export const basicMessage = (
  content: string,
  options: Partial<{ color: RGBTuple | number }> = {}
): Required<InteractionReplyOptions>['components'][number] => {
  return new ContainerBuilder()
    .setAccentColor(options.color ?? Colors.DarkBlue)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
};

export const basicErrorMessage = (content: string) =>
  basicMessage(content, { color: Colors.Red });
