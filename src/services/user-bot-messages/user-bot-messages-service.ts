import type { GuildMember } from 'discord.js';
import { prisma } from '@/db/prisma.js';
import { isStaff } from '@/util/permissions.js';
import { DAY } from '@/constants/time.js';
import { getBotOption } from '@/options.js';
import { OptionKey } from '@/generated/prisma/enums.js';

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
          expiresAt: new Date(Date.now() + 7 * DAY),
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
    const daysToKeep = getBotOption(
      OptionKey.DAYS_TO_KEEP_USER_BOT_MESSAGES
    ).value;
    setInterval(cleanup, daysToKeep * DAY);
  },
};
