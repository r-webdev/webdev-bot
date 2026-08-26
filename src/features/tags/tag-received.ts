import { OptionKey } from '@generated/prisma/enums.js';
import { Events, type MessageCreateOptions } from 'discord.js';
import { createEvent } from '@/common/events/create-event.js';
import { getBotOption } from '@/options.js';
import { TagsCache } from '@/services/tags/tag-cache.js';
import { TagService } from '@/services/tags/tag-service.js';
import { UserBotMessagesService } from '@/services/user-bot-messages/user-bot-messages-service.js';
import type { FullTag } from '@/features/tags/list-tags.js';
import { stripAllCode } from '@/util/strip-code.js';

export const tagReceivedEvent = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (message) => {
    if (message.author.bot || message.author.system) {
      return;
    }

    const prefix = getBotOption(OptionKey.TAG_PREFIX).value;
    const tagRegex = new RegExp(
      `(?:^|\\s)${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([a-zA-Z][\\w-]*)`,
      'g'
    );
    const stripped = stripAllCode(message.content);
    const matches = [...stripped.matchAll(tagRegex)];
    if (matches.length === 0) {
      return;
    }

    const maxTags = getBotOption(OptionKey.MAX_TAGS_PER_MESSAGE).value;
    const seenTagIds = new Set<number>();
    const resolvedTags: FullTag[] = [];

    for (const match of matches) {
      if (resolvedTags.length >= maxTags) {
        break;
      }

      const aliasName = match[1];

      const cachedTagId = TagsCache.getTagId(aliasName);
      if (cachedTagId !== undefined) {
        if (seenTagIds.has(cachedTagId)) {
          continue;
        }

        const cached = TagsCache.getTag(cachedTagId);
        if (cached) {
          seenTagIds.add(cachedTagId);
          resolvedTags.push(cached);
          continue;
        }
      }

      const tag = await TagService.getByName(aliasName);
      if (!tag) {
        continue;
      }

      if (seenTagIds.has(tag.id)) {
        continue;
      }
      seenTagIds.add(tag.id);
      resolvedTags.push(tag);
    }

    if (resolvedTags.length === 0) {
      return;
    }

    let index = 0;
    for (const tag of resolvedTags) {
      void TagService.incrementUses(tag.id);

      const options: MessageCreateOptions = {
        content: tag.content,
        reply:
          index > 0
            ? undefined
            : {
                messageReference: message.reference?.messageId ?? message.id,
              },
        allowedMentions: {
          parse: [],
          repliedUser: message.reference !== null,
        },
      };

      const sentMessage = await message.channel.send(options);
      void UserBotMessagesService.addUserBotMessage({
        messageId: sentMessage.id,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      index++;
    }
  }
);
