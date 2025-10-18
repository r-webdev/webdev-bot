import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChannelType, type Client, EmbedBuilder, type TextChannel } from 'discord.js';
import { config } from '../env.js';
import { parseMarkdown } from './markdown.js';

export type GuideInfo = {
  name: string;
  filename: string;
  hash: string;
  messageId?: string;
  content: string;
  frontmatter: Record<string, unknown>;
};

const guidesColors = [0xff5733, 0x33ff57, 0x3357ff, 0xff33a8, 0xa833ff, 0x33fff5];
const getRandomColor = () => guidesColors[Math.floor(Math.random() * guidesColors.length)];
const createGuideEmbed = (guide: GuideInfo) =>
  new EmbedBuilder()
    .setTitle(guide.name)
    .setDescription(guide.content)
    .setColor(getRandomColor())
    .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` });

export type GuideTracker = {
  [filename: string]: {
    hash: string;
    messageId?: string;
  };
};

const GUIDES_DIR = fileURLToPath(new URL('../commands/guides/subjects/', import.meta.url));

const TRACKER_FILE = config.guides.trackerPath ?? 'guides-tracker.json';

const calculateHash = (content: string): string => {
  return createHash('sha256').update(content, 'utf8').digest('hex');
};

const loadTracker = async (): Promise<GuideTracker> => {
  try {
    const content = await readFile(TRACKER_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    console.log('No existing tracker file found, starting fresh');
    return {};
  }
};

const saveTracker = async (tracker: GuideTracker): Promise<void> => {
  await writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2), 'utf8');
};

const scanGuideFiles = async (): Promise<GuideInfo[]> => {
  const files = await readdir(GUIDES_DIR);
  const guides: GuideInfo[] = [];

  for (const filename of files) {
    if (!filename.endsWith('.md')) {
      continue;
    }

    const filePath = join(GUIDES_DIR, filename);
    const content = await readFile(filePath, 'utf8');
    const { frontmatter, content: markdownContent } = await parseMarkdown(content);

    const hash = calculateHash(content);
    const name = (frontmatter.name as string) || filename.replace('.md', '');

    guides.push({
      name,
      filename,
      hash,
      content: markdownContent,
      frontmatter,
    });
  }

  return guides;
};

const postGuideToChannel = async (channel: TextChannel, guide: GuideInfo): Promise<string> => {
  const message = await channel.send({
    embeds: [createGuideEmbed(guide)],
  });

  console.log(`✅ Posted guide "${guide.name}" (${guide.filename})`);
  return message.id;
};

const editGuideMessage = async (
  channel: TextChannel,
  messageId: string,
  guide: GuideInfo
): Promise<void> => {
  try {
    const message = await channel.messages.fetch(messageId);
    await message.edit({
      embeds: [createGuideEmbed(guide)],
    });

    console.log(`📝 Updated guide "${guide.name}" (${guide.filename})`);
  } catch (error) {
    console.error(`Failed to edit message ${messageId} for guide "${guide.name}":`, error);
    throw error;
  }
};

const deleteGuideMessage = async (
  channel: TextChannel,
  messageId: string,
  guideName: string
): Promise<void> => {
  try {
    const message = await channel.messages.fetch(messageId);
    await message.delete();

    console.log(`🗑️ Deleted guide "${guideName}"`);
  } catch (error) {
    console.error(`Failed to delete message ${messageId} for guide "${guideName}":`, error);
  }
};

export const syncGuidesToChannel = async (client: Client, channelId: string): Promise<void> => {
  console.log('🔄 Starting guide synchronization...');

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.type !== ChannelType.GuildText) {
      throw new Error(`Channel ${channelId} is not a valid text channel`);
    }
    // Load current state
    const tracker = await loadTracker();
    const currentGuides = await scanGuideFiles();

    // Create maps for easier lookup
    const currentGuideMap = new Map(currentGuides.map((guide) => [guide.filename, guide]));
    const trackedFiles = new Set(Object.keys(tracker));
    const currentFiles = new Set(currentGuides.map((guide) => guide.filename));

    // Find changes
    const newFiles = [...currentFiles].filter((file) => !trackedFiles.has(file));
    const deletedFiles = [...trackedFiles].filter((file) => !currentFiles.has(file));
    const modifiedFiles = [...currentFiles].filter((file) => {
      const guide = currentGuideMap.get(file);
      return guide && trackedFiles.has(file) && tracker[file].hash !== guide.hash;
    });

    console.log(
      `📊 Found: ${newFiles.length} new, ${modifiedFiles.length} modified, ${deletedFiles.length} deleted`
    );

    // Process deletions first
    for (const filename of deletedFiles) {
      const messageId = tracker[filename].messageId;
      if (messageId) {
        await deleteGuideMessage(channel, messageId, filename);
      }
      delete tracker[filename];
    }

    // Process new guides
    for (const filename of newFiles) {
      const guide = currentGuideMap.get(filename)!;
      const messageId = await postGuideToChannel(channel, guide);

      tracker[filename] = {
        hash: guide.hash,
        messageId,
      };
    }

    // Process modifications
    for (const filename of modifiedFiles) {
      const guide = currentGuideMap.get(filename)!;
      const messageId = tracker[filename].messageId;

      if (messageId) {
        await editGuideMessage(channel, messageId, guide);
      } else {
        // If no message ID, treat as new
        const newMessageId = await postGuideToChannel(channel, guide);
        tracker[filename].messageId = newMessageId;
      }

      tracker[filename].hash = guide.hash;
    }

    await saveTracker(tracker);

    const totalChanges = newFiles.length + modifiedFiles.length + deletedFiles.length;
    if (totalChanges === 0) {
      console.log('✨ All guides are up to date!');
    } else {
      console.log(`✅ Guide synchronization complete! Made ${totalChanges} changes.`);
    }
  } catch (error) {
    console.error('❌ Guide synchronization failed:', error);
    throw error;
  }
};

export const initializeGuidesChannel = async (client: Client, channelId: string): Promise<void> => {
  console.log('🚀 Initializing guides channel...');

  // Clear existing tracker for fresh start
  await saveTracker({});

  await syncGuidesToChannel(client, channelId);
};
