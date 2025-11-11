import { ChannelType, type Client, type ForumChannel } from 'discord.js';
import * as cron from 'node-cron';
import { promises as fs } from 'node:fs';

const TRACKER_FILE = 'advent-of-code-tracker.json';

type TrackerData = {
  [year: string]: number[];
};

/**
 * Load the tracker file to see which days have already been posted
 */
async function loadTracker(): Promise<TrackerData> {
  try {
    const data = await fs.readFile(TRACKER_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (_error) {
    // If file doesn't exist or can't be read, return empty object
    return {};
  }
}

/**
 * Save the tracker file with updated data
 */
async function saveTracker(data: TrackerData): Promise<void> {
  await fs.writeFile(TRACKER_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Check if a specific day has already been posted for a given year
 */
async function isDayPosted(year: number, day: number): Promise<boolean> {
  const tracker = await loadTracker();
  const yearData = tracker[year.toString()];
  return yearData ? yearData.includes(day) : false;
}

/**
 * Mark a day as posted for a given year
 */
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

/**
 * Create a forum post for a specific Advent of Code day
 */
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

    const forumChannel = channel as ForumChannel;
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

/**
 * Check if today is during Advent of Code (December 1-25) and create post if needed
 */
async function checkAndCreateTodaysPost(client: Client, channelId: string): Promise<void> {
  const now = new Date();
  const month = now.getUTCMonth(); // 0-indexed, so December is 11
  const day = now.getUTCDate();
  const year = now.getUTCFullYear();

  // Only run during December (month 11)
  if (month !== 10) {
    return;
  }

  // Only run for days 1-25
  if (day < 1 || day > 25) {
    return;
  }

  // Check if we've already posted for this day this year
  const alreadyPosted = await isDayPosted(year, day);
  if (alreadyPosted) {
    console.log(`ℹ️ Advent of Code post for ${year} day ${day} already exists`);
    return;
  }

  // Create the post
  const success = await createAdventPost(client, channelId, year, day);

  // Mark as posted if successful
  if (success) {
    await markDayAsPosted(year, day);
  }
}

/**
 * Initialize the Advent of Code scheduler
 * Runs every day at midnight UTC and checks if we should create a post
 */
export function initializeAdventScheduler(client: Client, channelId: string): void {
  console.log('🎄 Initializing Advent of Code scheduler...');

  // Run immediately on startup to check if we need to post today
  checkAndCreateTodaysPost(client, channelId).catch((error) => {
    console.error('❌ Error checking for Advent of Code post on startup:', error);
  });

  // Schedule to run every day at midnight UTC
  // Cron pattern: '0 5 * * *' = At 05:00 UTC every day (midnight UTC-5)
  cron.schedule('0 5 * * *', () => {
    console.log('⏰ Running scheduled Advent of Code check...');
    checkAndCreateTodaysPost(client, channelId).catch((error) => {
      console.error('❌ Error in scheduled Advent of Code check:', error);
    });
  });

  console.log('✅ Advent of Code scheduler initialized (runs daily at midnight UTC)');
}
