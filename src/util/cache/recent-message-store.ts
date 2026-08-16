import type { Message } from 'discord.js';
import { MAX_RULE_TIMEFRAME } from '@/features/spam-detection/constants.js';

// O(1) Priority Queue implementation for LRU eviction
class MinHeap {
  private heap: Array<{ messageId: string; accessTime: number }> = [];

  private parent(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private leftChild(index: number): number {
    return 2 * index + 1;
  }

  private rightChild(index: number): number {
    return 2 * index + 2;
  }

  private swap(index: number, otherIndex: number): void {
    [this.heap[index], this.heap[otherIndex]] = [
      this.heap[otherIndex],
      this.heap[index],
    ];
  }

  private heapifyUp(index: number): void {
    while (
      index > 0 &&
      this.heap[this.parent(index)].accessTime > this.heap[index].accessTime
    ) {
      this.swap(index, this.parent(index));
      index = this.parent(index);
    }
  }

  private heapifyDown(index: number): void {
    while (this.leftChild(index) < this.heap.length) {
      let minChild = this.leftChild(index);
      if (
        this.rightChild(index) < this.heap.length &&
        this.heap[this.rightChild(index)].accessTime <
          this.heap[minChild].accessTime
      ) {
        minChild = this.rightChild(index);
      }

      if (this.heap[index].accessTime <= this.heap[minChild].accessTime) {
        break;
      }

      this.swap(index, minChild);
      index = minChild;
    }
  }

  push(messageId: string, accessTime: number): void {
    this.heap.push({ messageId, accessTime });
    this.heapifyUp(this.heap.length - 1);
  }

  pop(): { messageId: string; accessTime: number } | null {
    if (this.heap.length === 0) {
      return null;
    }

    const min = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }

    return min;
  }

  peek(): { messageId: string; accessTime: number } | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  size(): number {
    return this.heap.length;
  }

  clear(): void {
    this.heap = [];
  }

  // Remove specific item (O(n) but rarely used)
  remove(messageId: string): boolean {
    const index = this.heap.findIndex((item) => item.messageId === messageId);
    if (index === -1) {
      return false;
    }

    const last = this.heap.pop()!;
    if (index < this.heap.length) {
      this.heap[index] = last;

      if (
        index > 0 &&
        this.heap[this.parent(index)].accessTime > this.heap[index].accessTime
      ) {
        this.heapifyUp(index);
      } else {
        this.heapifyDown(index);
      }
    }
    return true;
  }
}

export class MessageCache {
  private cache = new Map<string, Message>();
  private userMessages = new Map<string, Set<string>>(); // userId -> Set<messageId>
  private channelMessages = new Map<string, Set<string>>(); // channelId -> Set<messageId>
  private maxSize: number;
  private lruHeap = new MinHeap();
  private accessTimes = new Map<string, number>(); // messageId -> access timestamp
  private nextAccessTime = 0;
  private cleanupInterval: number;

  constructor(maxSize: number = 1000, cleanupInterval: number = 100) {
    if (maxSize <= 0) {
      throw new Error('maxSize must be positive');
    }
    if (cleanupInterval <= 0) {
      throw new Error('cleanupInterval must be positive');
    }
    this.maxSize = maxSize;
    this.cleanupInterval = cleanupInterval;
  }

  add(message: Message): void {
    if (!message || !message.id || !message.author || !message.channelId) {
      throw new Error(
        'Invalid message: must be a valid Discord.js Message object'
      );
    }

    const messageId = message.id;
    const userId = message.author.id;
    const channelId = message.channelId;

    // Remove oldest messages if we're at capacity - O(1) with priority queue
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    // Periodic time-based cleanup (every cleanupInterval messages)
    if (this.cache.size % this.cleanupInterval === 0) {
      this.cleanupOldMessages(MAX_RULE_TIMEFRAME);
    }

    // Add to primary cache
    this.cache.set(messageId, message);

    // Update secondary indexes - O(1)
    if (!this.userMessages.has(userId)) {
      this.userMessages.set(userId, new Set());
    }
    this.userMessages.get(userId)!.add(messageId);

    if (!this.channelMessages.has(channelId)) {
      this.channelMessages.set(channelId, new Set());
    }
    this.channelMessages.get(channelId)!.add(messageId);

    // Update LRU tracking - O(log n) for heap operations
    const accessTime = ++this.nextAccessTime;
    this.accessTimes.set(messageId, accessTime);
    this.lruHeap.push(messageId, accessTime);
  }

  private evictOldest(): void {
    // O(1) eviction with priority queue
    while (this.lruHeap.size() > 0) {
      const oldest = this.lruHeap.pop();
      if (!oldest) {
        break;
      }

      // Check if this entry is still valid (not already deleted)
      if (this.accessTimes.get(oldest.messageId) === oldest.accessTime) {
        this.delete(oldest.messageId);
        break;
      }
      // If access times don't match, this is a stale entry, continue to next
    }
  }

  getStats(): {
    size: number;
    userCount: number;
    channelCount: number;
    heapSize: number;
  } {
    return {
      size: this.cache.size,
      userCount: this.userMessages.size,
      channelCount: this.channelMessages.size,
      heapSize: this.lruHeap.size(),
    };
  }

  // Clean up messages older than MAX_RULE_TIMEFRAME
  private cleanupOldMessages(maxRuleTimeframe: number): void {
    const now = Date.now();
    const cutoffTime = now - maxRuleTimeframe;
    const messagesToDelete: string[] = [];

    // Find messages older than cutoff
    for (const [messageId, message] of this.cache) {
      if (message.createdTimestamp < cutoffTime) {
        messagesToDelete.push(messageId);
      }
    }

    // Bulk delete old messages
    if (messagesToDelete.length > 0) {
      console.log(
        `Cleaning up ${messagesToDelete.length} old messages from cache (older than ${maxRuleTimeframe}ms)`
      );
      this.bulkDeleteByIds(messagesToDelete);
    }
  }

  // PUBLIC: Force cleanup of old messages (can be called externally)
  removeExpiredMessages(maxRuleTimeframe = MAX_RULE_TIMEFRAME): void {
    if (
      typeof maxRuleTimeframe !== 'number' ||
      maxRuleTimeframe <= 0 ||
      Number.isNaN(maxRuleTimeframe)
    ) {
      throw new Error('Invalid maxRuleTimeframe: must be a positive number');
    }
    this.cleanupOldMessages(maxRuleTimeframe);
  }

  get(messageId: string): Message | undefined {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid messageId: must be a non-empty string');
    }

    // Update LRU on access - O(log n) for heap operations
    if (this.cache.has(messageId)) {
      const accessTime = ++this.nextAccessTime;
      this.accessTimes.set(messageId, accessTime);
      this.lruHeap.push(messageId, accessTime);
      return this.cache.get(messageId);
    }
    return undefined;
  }

  has(messageId: string): boolean {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid messageId: must be a non-empty string');
    }
    return this.cache.has(messageId);
  }

  delete(messageId: string): boolean {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid messageId: must be a non-empty string');
    }

    if (!this.cache.has(messageId)) {
      return false;
    }

    const message = this.cache.get(messageId)!;
    const userId = message.author.id;
    const channelId = message.channelId;

    // Remove from primary cache
    this.cache.delete(messageId);

    // Remove from secondary indexes - O(1)
    this.userMessages.get(userId)?.delete(messageId);
    this.channelMessages.get(channelId)?.delete(messageId);

    // Clean up empty index sets
    if (this.userMessages.get(userId)?.size === 0) {
      this.userMessages.delete(userId);
    }
    if (this.channelMessages.get(channelId)?.size === 0) {
      this.channelMessages.delete(channelId);
    }

    // Remove from LRU tracking
    this.accessTimes.delete(messageId);
    // Note: We don't remove from heap immediately for performance
    // Stale entries are handled during eviction

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.userMessages.clear();
    this.channelMessages.clear();
    this.lruHeap.clear();
    this.accessTimes.clear();
    this.nextAccessTime = 0;
  }

  size(): number {
    return this.cache.size;
  }

  // O(1) user message lookup using secondary index
  getUserMessages(userId: string): Message[] {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }

    const messageIds = this.userMessages.get(userId);
    if (!messageIds) {
      return [];
    }

    return Array.from(messageIds)
      .map((id) => this.cache.get(id))
      .filter((message): message is Message => message !== undefined);
  }

  // O(1) channel message lookup using secondary index
  getChannelMessages(channelId: string): Message[] {
    if (!channelId || typeof channelId !== 'string') {
      throw new Error('Invalid channelId: must be a non-empty string');
    }

    const messageIds = this.channelMessages.get(channelId);
    if (!messageIds) {
      return [];
    }

    return Array.from(messageIds)
      .map((id) => this.cache.get(id))
      .filter((msg): msg is Message => msg !== undefined);
  }

  // O(k) where k is user's message count
  getMessagesInTimeRange(
    userId: string,
    startTime: number,
    endTime?: number
  ): Message[] {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
    if (typeof startTime !== 'number' || Number.isNaN(startTime)) {
      throw new Error('Invalid startTime: must be a valid number');
    }
    if (
      endTime !== undefined &&
      (typeof endTime !== 'number' || Number.isNaN(endTime))
    ) {
      throw new Error('Invalid endTime: must be a valid number or undefined');
    }
    if (endTime !== undefined && endTime < startTime) {
      throw new Error(
        'Invalid time range: endTime must be greater than or equal to startTime'
      );
    }

    const userMessageIds = this.userMessages.get(userId);
    if (!userMessageIds) {
      return [];
    }

    return Array.from(userMessageIds)
      .map((id) => this.cache.get(id))
      .filter(
        (message): message is Message =>
          message !== undefined &&
          message.createdTimestamp >= startTime &&
          (endTime === undefined || message.createdTimestamp <= endTime)
      );
  }

  bulkDeleteByIds(messageIds: string[]): void {
    if (!Array.isArray(messageIds)) {
      throw new Error('Invalid messageIds: must be an array');
    }

    for (const id of messageIds) {
      if (typeof id !== 'string' || !id) {
        throw new Error(
          'Invalid messageId in array: must be non-empty strings'
        );
      }
    }

    for (const id of messageIds) {
      this.delete(id);
    }
  }
}

export const cachedMessages = new MessageCache(5_000);
