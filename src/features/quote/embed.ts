import { clampText } from '@/util/text.js';
import {
  ActionRowBuilder,
  type APIEmbedField,
  type APIMessageTopLevelComponent,
  type APITextDisplayComponent,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  type Message,
  type MessageActionRowComponentBuilder,
  type MessageCreateOptions,
  MessageFlags,
  TextDisplayBuilder,
  type User,
} from 'discord.js';

import { DELETE_EMOJIS } from '../reactions/remove-user-bot-message.js';

const EMBED_DESC_LIMIT = 4096;
const FIELD_VALUE_LIMIT = 1024;
const JUMP_BUTTON_LABEL = 'Jump to message';
const EMOJIS = DELETE_EMOJIS.join('/');
const DELETE_HINT = `React with ${EMOJIS} to delete`;
const DELETE_HINT_LINE = `-# ${DELETE_HINT}`;

const isTextDisplayComponent = (
  component: APIMessageTopLevelComponent
): component is APITextDisplayComponent =>
  component.type === ComponentType.TextDisplay;

const applyDeleteHint = (embed: EmbedBuilder): void => {
  if (!embed.data.footer?.text) {
    embed.setFooter({ text: DELETE_HINT });
  } else if (!embed.data.footer.text.includes(DELETE_HINT)) {
    embed.setFooter({ text: `${embed.data.footer.text} | ${DELETE_HINT}` });
  }
};

type OriginalQuoteInfo = {
  authorMention: string;
  channelName: string;
  jumpLink: string;
};

// Captures the pieces of a line we previously generated:
// "<@quotedBy> quoted <@author> from **#channel** [link ↗](<url>)"  (V2, has link)
// "<@quotedBy> quoted <@author> from **#channel**"                  (V1, no link)
const QUOTE_LINE_CAPTURE_REGEX =
  /^(?:-#\s)?<@!?\d+>\squoted\s(<@!?\d+>)\sfrom\s\*\*#(.+?)\*\*(?:\s\[link ↗\]\(<(.+?)>\))?$/;

type ParsedQuoteLine = {
  authorMention: string;
  channelName: string;
  jumpLink?: string;
};

const parseQuoteLine = (text: string): ParsedQuoteLine | null => {
  const match = QUOTE_LINE_CAPTURE_REGEX.exec(text);
  if (!match) {
    return null;
  }
  const [, authorMention, channelName, jumpLink] = match;
  return { authorMention, channelName, jumpLink };
};

const buildQuoteLine = (
  quotedBy: User,
  info: OriginalQuoteInfo,
  includeLink: boolean
): string =>
  clampText(
    includeLink
      ? `${quotedBy.toString()} quoted ${info.authorMention} from **#${info.channelName}** [link ↗](<${info.jumpLink}>)`
      : `${quotedBy.toString()} quoted ${info.authorMention} from **#${info.channelName}**`,
    FIELD_VALUE_LIMIT
  );

const findExistingJumpButtonUrl = (message: Message): string | null => {
  for (const row of message.components) {
    if (row.type !== ComponentType.ActionRow) {
      continue;
    }
    for (const component of row.components) {
      if (
        component.type === ComponentType.Button &&
        component.style === ButtonStyle.Link &&
        component.label === JUMP_BUTTON_LABEL
      ) {
        return component.url ?? null;
      }
    }
  }
  return null;
};

export const createQuoteEmbed = ({
  quotedMessage,
  quotedBy,
}: {
  quotedMessage: Message;
  quotedBy: User;
}): MessageCreateOptions | null => {
  const channelName = !quotedMessage.channel.isDMBased()
    ? quotedMessage.channel.name
    : 'Direct Message';

  // Default: quotedMessage is an original, non-quote message, so it *is*
  // the source of truth for author/channel/link.
  const freshInfo: OriginalQuoteInfo = {
    authorMention: `${quotedMessage.author.toString()}`,
    channelName,
    jumpLink: quotedMessage.url,
  };

  const isV2 = quotedMessage.flags.has(MessageFlags.IsComponentsV2);

  if (isV2) {
    const components = quotedMessage.components.map((component) =>
      component.toJSON()
    );

    const existingLineIndex = components.findIndex(
      (component) => component.type === ComponentType.TextDisplay
    );
    const existingComponent = components[existingLineIndex];
    const existingContent =
      existingComponent && isTextDisplayComponent(existingComponent)
        ? existingComponent.content
        : null;

    const parsed =
      existingContent !== null ? parseQuoteLine(existingContent) : null;

    const originalInfo: OriginalQuoteInfo = parsed
      ? {
          authorMention: parsed.authorMention,
          channelName: parsed.channelName,
          jumpLink: parsed.jumpLink ?? freshInfo.jumpLink,
        }
      : freshInfo;

    const attributionLine = new TextDisplayBuilder()
      .setContent(`-# ${buildQuoteLine(quotedBy, originalInfo, true)}`)
      .toJSON();

    if (existingLineIndex !== -1) {
      components[existingLineIndex] = attributionLine;
    } else {
      components.push(attributionLine);
    }

    const hasDeleteHint = components.some(
      (component) =>
        isTextDisplayComponent(component) &&
        component.content === DELETE_HINT_LINE
    );
    if (!hasDeleteHint) {
      components.push(
        new TextDisplayBuilder().setContent(DELETE_HINT_LINE).toJSON()
      );
    }

    return {
      allowedMentions: { parse: [] },
      components,
      flags: MessageFlags.IsComponentsV2,
    };
  }

  // Legacy (non-V2 components)
  const attachmentUrls = quotedMessage.attachments.map(
    (attachment) => attachment.url
  );
  const firstImage = quotedMessage.attachments.find((attachment) =>
    attachment.contentType?.startsWith('image/')
  );

  let embeds = quotedMessage.embeds
    .filter((embed) => embed.data.type === 'rich')
    .slice(0, 9) // leave room for our wrapper, max 10 embeds/message
    .map((embed) => EmbedBuilder.from(embed));

  // Find an existing "Quoted by" field, if quotedMessage is itself a quote.
  let existingField: APIEmbedField | null = null;
  let existingFieldEmbed: EmbedBuilder | null = null;
  for (const embed of embeds) {
    const found = embed.data.fields?.find(
      (field) => /^quoted by$/i.test(field.name) && parseQuoteLine(field.value)
    );
    if (found) {
      existingField = found;
      existingFieldEmbed = embed;
      break;
    }
  }

  const parsedField = existingField
    ? parseQuoteLine(existingField.value)
    : null;

  // Recover link from the existing jump button, if present, otherwise fall back to the parsed field or fresh info.
  const originalInfo: OriginalQuoteInfo = parsedField
    ? {
        authorMention: parsedField.authorMention,
        channelName: parsedField.channelName,
        jumpLink:
          findExistingJumpButtonUrl(quotedMessage) ??
          parsedField.jumpLink ??
          freshInfo.jumpLink,
      }
    : freshInfo;

  const quotedByField: APIEmbedField = {
    name: 'Quoted by',
    value: buildQuoteLine(quotedBy, originalInfo, false),
    inline: false,
  };

  if (existingField) {
    // Already a quote: swap the field's value in place, keep everything
    // else (original author/description/image/timestamp) untouched.
    existingField.value = quotedByField.value;
    if (existingFieldEmbed) {
      applyDeleteHint(existingFieldEmbed);
    }
  } else {
    // First-time quote: build the wrapper/annotation.
    const authorOptions = {
      name: quotedMessage.author.username,
      iconURL: quotedMessage.author.displayAvatarURL({ size: 64 }),
    };

    const stampAsQuote = (embed: EmbedBuilder) => {
      embed.setAuthor(authorOptions).addFields(quotedByField).setTimestamp();
      applyDeleteHint(embed);
      return embed;
    };

    const hasContent = quotedMessage.content.length > 0;
    const hasEmbeds = embeds.length > 0;
    const hasAttachments = attachmentUrls.length > 0;
    const hasStickers = quotedMessage.stickers.size > 0;

    if (!hasContent && !hasStickers && !hasEmbeds && !hasAttachments) {
      return null;
    }

    if (hasContent || hasStickers || (!hasEmbeds && !hasAttachments)) {
      const wrapper = stampAsQuote(new EmbedBuilder()).setDescription(
        hasContent
          ? clampText(quotedMessage.content, EMBED_DESC_LIMIT)
          : hasStickers
            ? '*sent a sticker*'
            : null
      );
      if (firstImage) {
        wrapper.setImage(firstImage.url);
      }
      embeds = [wrapper, ...embeds];
    } else if (hasEmbeds) {
      embeds[0] = stampAsQuote(embeds[0]);
    } else {
      embeds = [
        stampAsQuote(new EmbedBuilder()).setImage(firstImage?.url ?? null),
      ];
    }
  }

  // Don't re-send the image we already used as the embed's setImage,
  // otherwise it shows up twice.
  const filesToSend = firstImage
    ? attachmentUrls.filter((url) => url !== firstImage.url)
    : attachmentUrls;

  return {
    allowedMentions: { parse: [] },
    embeds: embeds.length > 0 ? embeds : undefined,
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setURL(originalInfo.jumpLink)
          .setLabel(JUMP_BUTTON_LABEL)
          .setStyle(ButtonStyle.Link)
      ),
    ],
    files: filesToSend.length > 0 ? filesToSend : undefined,
  };
};
