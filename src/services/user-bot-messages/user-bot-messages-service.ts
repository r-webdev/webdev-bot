import type { GuildMember } from 'discord.js';
import { prisma } from '@/db/prisma.js';
import { isStaff } from '@/util/permissions.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // every hour

export const UserBotMessagesService = {
  async deleteUserBotMessage({
    messageId,
    user,
  }: {
    messageId: string;
    user: GuildMember;
  }): Promise<boolean> {
    const message = await prisma.userBotMessages.findUnique({
      where: { id: messageId },
    });

    if (message === null) {
      return false;
    }

    if (message.userId !== user.id && !isStaff(user)) {
      return false;
    }

    try {
      await prisma.userBotMessages.delete({ where: { id: messageId } });
      return true;
    } catch {
      return false;
    }
  },

  async addUserBotMessage({
    userId,
    messageId,
    channelId,
  }: {
    userId: string;
    messageId: string;
    channelId: string;
  }): Promise<void> {
    try {
      await prisma.userBotMessages.create({
        data: {
          channelId,
          id: messageId,
          userId,
        },
      });
    } catch {}
  },

  async startExpiredMessageCleanup() {
    const cleanup = async () => {
      const { count } = await prisma.userBotMessages.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });
      if (count > 0) {
        console.log(`Cleaned up ${count} expired user bot messages.`);
      }
    };

    void cleanup();
    setInterval(cleanup, CLEANUP_INTERVAL_MS);
  },
};
