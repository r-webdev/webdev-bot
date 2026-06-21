import { createSlashCommand } from '@/common/commands/create-commands.js';
import { config } from '@/env.js';
import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { createShowcaseMessageContent, parseShowcaseMessage } from './util.js';

type ThreadResult = { id: string; status: 'changed' | 'skipped' };

export const showcaseTempRestructureCommand = createSlashCommand({
  data: {
    name: 'showcase_temp_restructure',
    description: 'Restructure showcase messages to the new format',
    default_member_permissions: new PermissionsBitField(
      PermissionFlagsBits.ModerateMembers
    ).toJSON(),
  },
  execute: async (interaction) => {
    await interaction.deferReply();
    const showcaseChannel = interaction.guild?.channels.cache.get(
      config.channelIds.showcase
    );
    if (!showcaseChannel?.isThreadOnly()) {
      await interaction.editReply({
        content: 'Showcase channel not found or is not a thread-only channel.',
      });
      return;
    }
    const [activePosts, archivedPosts] = await Promise.all([
      showcaseChannel.threads.fetchActive(),
      showcaseChannel.threads.fetchArchived(),
    ]);
    const allPosts = new Map([
      ...activePosts.threads,
      ...archivedPosts.threads,
    ]);

    const results = await Promise.allSettled(
      Array.from(allPosts.values()).map(
        async (thread): Promise<ThreadResult> => {
          const message = await thread.fetchStarterMessage();
          if (!message) {
            return { id: thread.id, status: 'skipped' };
          }
          if (message.content.startsWith('## Project Name:')) {
            const { link, description, authorId } = parseShowcaseMessage(
              message.content
            );
            const newContent = createShowcaseMessageContent({
              link,
              description,
              authorId,
            });
            await message.edit({ content: newContent });
            return { id: thread.id, status: 'changed' };
          }
          return { id: thread.id, status: 'skipped' };
        }
      )
    );

    const changedThreads: string[] = [];
    const skippedThreads: string[] = [];
    const failedThreads: { id: string; reason: unknown }[] = [];

    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        const thread = Array.from(allPosts.values())[index];
        failedThreads.push({ id: thread.id, reason: result.reason });
        continue;
      }
      if (result.value.status === 'changed') {
        changedThreads.push(result.value.id);
      } else {
        skippedThreads.push(result.value.id);
      }
    }

    if (failedThreads.length > 0) {
      console.error(
        'Showcase restructure failures:',
        failedThreads.map((f) => ({ id: f.id, reason: String(f.reason) }))
      );
    }

    const sections = [
      `Restructured ${changedThreads.length} showcase message(s).`,
      changedThreads.length > 0
        ? changedThreads.map((id) => `- <#${id}>`).join('\n')
        : undefined,
      `Skipped ${skippedThreads.length} thread(s) already in the new format.`,
      failedThreads.length > 0
        ? `Failed to process ${failedThreads.length} thread(s):\n${failedThreads
            .map((f) => `- <#${f.id}>`)
            .join('\n')}`
        : undefined,
    ].filter((line): line is string => line !== undefined);

    await interaction.editReply({
      content: sections.join('\n'),
    });
  },
});
