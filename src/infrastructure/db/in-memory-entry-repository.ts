import type {
  EntryRepository,
  EntryFilter,
  SaveFetchedEntriesInput,
} from "@/application/ports";
import type { Entry, UserEntry } from "@/domain/entities";
import { createId, inMemoryStore } from "./in-memory-store";

export class InMemoryEntryRepository implements EntryRepository {
  async listByFilter(filter: EntryFilter): Promise<Entry[]> {
    const subscribedFeedIds = new Set(
      inMemoryStore.subscriptions
        .filter((subscription) => subscription.userId === filter.userId)
        .map((subscription) => subscription.feedId),
    );

    const userEntriesById = new Map(
      inMemoryStore.userEntries
        .filter((state) => state.userId === filter.userId)
        .map((state) => [state.entryId, state]),
    );

    return inMemoryStore.entries
      .filter((entry) => subscribedFeedIds.has(entry.feedId))
      .filter((entry) =>
        filter.feedId ? entry.feedId === filter.feedId : true,
      )
      .filter((entry) => {
        if (!filter.unreadOnly) return true;
        return !userEntriesById.get(entry.id)?.isRead;
      })
      .filter((entry) => {
        if (!filter.bookmarkedOnly) return true;
        return Boolean(userEntriesById.get(entry.id)?.isBookmarked);
      })
      .filter((entry) => {
        if (!filter.search) return true;
        const q = filter.search.toLowerCase();
        return (
          entry.title.toLowerCase().includes(q) ||
          (entry.content ?? "").toLowerCase().includes(q)
        );
      })
      .filter((entry) => {
        if (!filter.tagId) return true;
        // その記事に指定したタグが紐づいているか(指定したentryId, tagIdであるか)
        return inMemoryStore.entryTags.some(
          (et) => et.entryId === entry.id && et.tagId === filter.tagId,
        );
      })
      .sort((a, b) => {
        const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime();
        const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime();
        return bTime - aTime;
      })
      .slice(0, filter.limit ?? 50);
  }

  async findByIdForUser(input: {
    userId: string;
    entryId: string;
  }): Promise<Entry | null> {
    const entry = inMemoryStore.entries.find(
      (item) => item.id === input.entryId,
    );
    if (!entry) {
      return null;
    }

    const isSubscribed = inMemoryStore.subscriptions.some(
      (subscription) =>
        subscription.userId === input.userId &&
        subscription.feedId === entry.feedId,
    );

    return isSubscribed ? entry : null;
  }

  async saveFetchedEntries(input: SaveFetchedEntriesInput): Promise<string[]> {
    const insertedIds: string[] = [];

    for (const item of input.entries) {
      // UNIQUE(feed_id, guid)
      const exists = inMemoryStore.entries.some(
        (entry) => entry.feedId === input.feedId && entry.guid === item.guid,
      );

      if (exists) {
        continue;
      }

      const id = createId();
      const entry: Entry = {
        id,
        feedId: input.feedId,
        guid: item.guid,
        title: item.title,
        url: item.url,
        content: item.content ?? null,
        publishedAt: item.publishedAt ?? null,
        author: item.author ?? null,
        createdAt: new Date(),
      };

      inMemoryStore.entries.push(entry);
      insertedIds.push(id);
    }

    return insertedIds;
  }

  async markAsRead(input: {
    userId: string;
    entryId: string;
    readAt: Date;
  }): Promise<UserEntry> {
    const state = this.upsertUserEntry(input.userId, input.entryId);
    state.isRead = true;
    state.readAt = input.readAt;
    return state;
  }

  async markAsUnread(input: {
    userId: string;
    entryId: string;
  }): Promise<UserEntry> {
    const state = this.upsertUserEntry(input.userId, input.entryId);
    state.isRead = false;
    state.readAt = null;
    return state;
  }

  async toggleBookmark(input: {
    userId: string;
    entryId: string;
    isBookmarked: boolean;
  }): Promise<UserEntry> {
    const state = this.upsertUserEntry(input.userId, input.entryId);
    state.isBookmarked = input.isBookmarked;
    return state;
  }

  async listPublicEntriesBySlug(input: {
    slug: string;
    limit?: number;
    cursor?: string;
  }): Promise<Entry[]> {
    const profile = inMemoryStore.publicProfiles.find(
      (item) => item.publicSlug === input.slug && item.isPublic,
    );
    if (!profile) {
      return [];
    }

    const feedIds = new Set(
      inMemoryStore.subscriptions
        .filter((subscription) => subscription.userId === profile.userId)
        .map((subscription) => subscription.feedId),
    );

    return inMemoryStore.entries
      .filter((entry) => feedIds.has(entry.feedId))
      .sort((a, b) => {
        const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime();
        const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime();
        return bTime - aTime;
      })
      .slice(0, input.limit ?? 50);
  }

  private upsertUserEntry(userId: string, entryId: string): UserEntry {
    // PRIMARY KEY(user_id, entry_id) を想定。
    const existing = inMemoryStore.userEntries.find(
      (item) => item.userId === userId && item.entryId === entryId,
    );
    if (existing) {
      return existing;
    }

    const created: UserEntry = {
      userId,
      entryId,
      isRead: false,
      isBookmarked: false,
      readAt: null,
    };
    inMemoryStore.userEntries.push(created);
    return created;
  }
}
