const moderationCounts = new Map<string, number>();

export const isUserBeingModerated = (userId: string): boolean => {
  return moderationCounts.has(userId);
};

export const startModeration = (userId: string): void => {
  moderationCounts.set(userId, (moderationCounts.get(userId) ?? 0) + 1);
};

export const finishModeration = (userId: string): void => {
  const moderationCount = moderationCounts.get(userId);
  if (moderationCount === undefined || moderationCount === 1) {
    moderationCounts.delete(userId);
    return;
  }

  moderationCounts.set(userId, moderationCount - 1);
};
