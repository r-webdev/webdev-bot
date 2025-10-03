import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
} from 'discord.js';
import { logToChannel } from '../../util/channel-logging.js';
import { createCommand } from '../index.js';
import { getDirectUrl, getSearchUrl } from './providers.js';

type SearchResult = {
  documents: Array<{
    mdn_url: string;
    title: string;
    slug: string;
    summary: string;
  }>;
};

const list = new Intl.ListFormat('en-US');

export default createCommand(
  {
    name: 'mdn',
    description: 'Search MDN for documentation on web development topics',
    options: [
      {
        name: 'query',
        type: ApplicationCommandOptionType.String,
        description: 'The search query',
        required: true,
      },
    ],
  },
  async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const query = interaction.options.getString('query', true);

    try {
      const url = getSearchUrl('mdn', query);

      const response = await fetch(url);
      if (!response.ok) {
        await interaction.reply({
          content: `Error: ${response.status} ${response.statusText}`,
          ephemeral: true,
        });
        return;
      }

      const data = (await response.json()) as SearchResult;

      if (data.documents.length === 0) {
        await interaction.reply({ content: `No results found for "${query}"`, ephemeral: true });
        return;
      }

      const results = new Collection(data.documents.map((doc) => [doc.slug, doc]));

      const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('mdn-select')
          .setPlaceholder('Select a 1 to 5 results')
          .setMinValues(1)
          .setMaxValues(Math.min(5, results.size))
          .addOptions(
            ...results.map((doc) => ({
              label: doc.title.length > 100 ? `${doc.title.slice(0, 97)}...` : doc.title,
              description:
                doc.summary.length > 100 ? `${doc.summary.slice(0, 97)}...` : doc.summary,
              value: doc.slug,
            }))
          )
      );

      const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setCustomId('mdn-cancel')
      );

      const choiceInteraction = await interaction.reply({
        content: `Select 1 to 5 results for **${query}**:`,
        components: [selectRow, buttonRow],
        flags: MessageFlags.Ephemeral,
      });

      const collector = choiceInteraction.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
      });

      collector.once('collect', async (i) => {
        if (i.isStringSelectMenu()) {
          // const selectedDocs = i.values
          //   .map((slug) => results.get(slug))
          //   .filter((doc): doc is NonNullable<typeof doc> => !!doc);

          // const links = selectedDocs
          //   .map((doc) => `**[${doc.title}](https://developer.mozilla.org${doc.mdn_url})**`)
          //   .join('\n');

          // await logToChannel({
          //   channel: interaction.channel,
          //   content: {
          //     type: 'embed',
          //     embed: new EmbedBuilder()
          //       .setTitle(`MDN results for ${query}`)
          //       .setDescription(links)
          //       .setColor(0x83d0f2)
          //       .setFooter({ text: 'Powered by MDN' })
          //       .setTimestamp(),
          //   },
          // });
          // collector.stop();

          const selectedDocsSet = new Set(i.values);
          const selectedDocs = results.filter((_, slug) => selectedDocsSet.has(slug));

          await interaction.editReply({
            content: `Displaying results for **${list.format(selectedDocs.map((doc) => doc.title))}**`,
            components: [],
          });

          logToChannel({
            channel: interaction.channel,
            content: {
              type: 'embed',
              embed: selectedDocs.map((doc) =>
                new EmbedBuilder()
                  .setTitle(doc.title)
                  .setURL(
                    getDirectUrl('mdn', doc.mdn_url) ??
                      `https://developer.mozilla.org${doc.mdn_url}`
                  )
                  .setDescription(doc.summary)
                  .setColor(0x83d0f2)
                  .setFooter({ text: 'Powered by MDN' })
                  .setTimestamp()
              ),
            },
          });
        } else if (i.isButton() && i.customId === 'mdn-cancel') {
          console.log('MDN search cancelled by user');
          // await i.update({ content: 'Search cancelled.', components: [] });
          await choiceInteraction.delete();
        } else {
          console.log('Unexpected interaction type');
        }
      });
    } catch (err) {
      console.error('MDN command error:', err);
    }
  }
);
