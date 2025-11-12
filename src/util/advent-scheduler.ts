import { ChannelType, type Client } from 'discord.js';
import * as cron from 'node-cron';
import { promises as fs } from 'node:fs';
import { config } from '../env.js';

const TRACKER_FILE = config.adventOfCodeTrackerPath;

type TrackerData = {
  [year: string]: number[];
};

export async function loadTracker(): Promise<TrackerData> {
  try {
    const data = await fs.readFile(TRACKER_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (_error) {
    // If file doesn't exist or can't be read, return empty object
    return {};
  }
}

export async function saveTracker(data: TrackerData): Promise<void> {
  await fs.writeFile(TRACKER_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function isDayPosted(year: number, day: number): Promise<boolean> {
  const tracker = await loadTracker();
  const yearData = tracker[year.toString()];
  return yearData ? yearData.includes(day) : false;
}

async function markDayAsPosted(year: number, day: number): Promise<void> {
  const tracker = await loadTracker();
  const yearKey = year.toString();

  if (!tracker[yearKey]) {
    tracker[yearKey] = [];
  }

  if (!tracker[yearKey].includes(day)) {
    tracker[yearKey].push(day);
    tracker[yearKey].sort((a, b) => a - b);
    await saveTracker(tracker);
  }
}

async function createAdventPost(
  client: Client,
  channelId: string,
  year: number,
  day: number
): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      console.error(`❌ Advent of Code channel not found: ${channelId}`);
      return false;
    }

    if (channel.type !== ChannelType.GuildForum) {
      console.error(`❌ Advent of Code channel is not a forum channel. Type: ${channel.type}`);
      return false;
    }

    const forumChannel = channel;
    const title = `Day ${day}, ${year}`;
    const content = `https://adventofcode.com/${year}/day/${day}`;

    await forumChannel.threads.create({
      name: title,
      message: {
        content: content,
      },
    });

    console.log(`✅ Created Advent of Code post: ${title}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create Advent of Code post for day ${day}:`, error);
    return false;
  }
}

async function checkAndCreateTodaysPost(client: Client, channelId: string): Promise<void> {
  const now = new Date();
  const month = now.getUTCMonth(); // 0-indexed, so December is 11
  const day = now.getUTCDate();
  const year = now.getUTCFullYear();

  if (month !== 11) {
    return;
  }

  if (day < 1 || day > 25) {
    return;
  }

  const alreadyPosted = await isDayPosted(year, day);
  if (alreadyPosted) {
    console.log(`ℹ️ Advent of Code post for ${year} day ${day} already exists`);
    return;
  }

  const success = await createAdventPost(client, channelId, year, day);

  if (success) {
    await markDayAsPosted(year, day);
  }
}

/**
 * Initialize the Advent of Code scheduler
 * Runs every day at midnight UTC-5 and checks if we should create a post
 */
export function initializeAdventScheduler(client: Client, channelId: string): void {
  console.log('🎄 Initializing Advent of Code scheduler...');

  checkAndCreateTodaysPost(client, channelId).catch((error) => {
    console.error('❌ Error checking for Advent of Code post on startup:', error);
  });

  // Schedule to run every day at midnight UTC-5
  // https://github.com/node-cron/node-cron?tab=readme-ov-file#cron-syntax
  cron.schedule('0 5 * * *', () => {
    console.log('⏰ Running scheduled Advent of Code check...');
    checkAndCreateTodaysPost(client, channelId).catch((error) => {
      console.error('❌ Error in scheduled Advent of Code check:', error);
    });
  });

  console.log('✅ Advent of Code scheduler initialized (runs daily at midnight UTC)');
}
