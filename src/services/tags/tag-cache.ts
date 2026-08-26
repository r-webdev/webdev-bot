import { LRUCache } from 'lru-cache/raw';
import type { FullTag } from '@/features/tags/list-tags.js';

class TagsCacheImpl {
  private readonly byName = new LRUCache<string, number>({
    max: 500,
    ttl: 1000 * 60 * 10,
  });

  private readonly byId = new LRUCache<number, FullTag>({
    max: 500,
    ttl: 1000 * 60 * 10,
  });

  addTag(tag: FullTag): void {
    this.byId.set(tag.id, tag);
    for (const alias of tag.aliases) {
      this.byName.set(alias.name, tag.id);
    }
  }

  removeTag(tag: FullTag): void {
    this.byId.delete(tag.id);
    for (const alias of tag.aliases) {
      this.byName.delete(alias.name);
    }
  }

  removeTagById(tagId: number): void {
    const tag = this.byId.get(tagId);
    if (tag) {
      this.removeTag(tag);
    }
  }

  addAlias(tagId: number, aliasName: string): void {
    this.byName.set(aliasName, tagId);
  }

  removeAlias(aliasName: string): void {
    this.byName.delete(aliasName);
  }

  getTag(tagId: number): FullTag | undefined {
    return this.byId.get(tagId);
  }

  getTagId(aliasName: string): number | undefined {
    return this.byName.get(aliasName);
  }

  hasAlias(aliasName: string): boolean {
    return this.byName.has(aliasName);
  }

  hasTag(tagId: number): boolean {
    return this.byId.has(tagId);
  }

  clear(): void {
    this.byName.clear();
    this.byId.clear();
  }

  get size(): number {
    return this.byId.size;
  }
}

export const TagsCache = new TagsCacheImpl();
