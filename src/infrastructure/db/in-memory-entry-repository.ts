import type {
  EntryRepository,
  EntryFilter,
  SaveFetchedEntriesInput,
} from "@/application/ports";
import type { Entry } from "@/domain/entities";
import { createId, inMemoryStore } from "./in-memory-store";

export class InMemoryEntryRepository implements EntryRepository {
  async listByFilter(filter: EntryFilter): Promise<Entry[]> {
    const subscribedFeedIds = new Set(
      inMemoryStore.subscriptions
        .filter((subscription) => subscription.userId === filter.userId)
        .map((subscription) => subscription.feedId),
    );


    return inMemoryStore.entries
      .filter((entry) => subscribedFeedIds.has(entry.feedId))
      .filter((entry) =>
        filter.feedId ? entry.feedId === filter.feedId : true,
      )
      .filter((entry) => {
        if (!filter.unreadOnly) return true;
        const isRead = inMemoryStore.entryTags.some(et => {
          if (et.entryId !== entry.id) return false;
          const tag = inMemoryStore.tags.find(t => t.id === et.tagId);
          return tag?.isSystem && tag?.name === 'Read' && tag?.userId === filter.userId;
        });
        return !isRead;
      })
      .filter((entry) => {
        if (!filter.bookmarkedOnly) return true;
        return inMemoryStore.entryTags.some(et => {
          if (et.entryId !== entry.id) return false;
          const tag = inMemoryStore.tags.find(t => t.id === et.tagId);
          return tag?.isSystem && tag?.name === 'Bookmark' && tag?.userId === filter.userId;
        });
      })
      .map((entry) => {
        const isRead = inMemoryStore.entryTags.some(et => {
          if (et.entryId !== entry.id) return false;
          const tag = inMemoryStore.tags.find(t => t.id === et.tagId);
          return tag?.isSystem && tag?.name === 'Read' && tag?.userId === filter.userId;
        });
        const isBookmarked = inMemoryStore.entryTags.some(et => {
          if (et.entryId !== entry.id) return false;
          const tag = inMemoryStore.tags.find(t => t.id === et.tagId);
          return tag?.isSystem && tag?.name === 'Bookmark' && tag?.userId === filter.userId;
        });
        return {
          ...entry,
          isRead,
          isBookmarked,
        };
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
        summary: null,
        imageUrl: item.imageUrl ?? null,
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
  }): Promise<void> {
    let tag = inMemoryStore.tags.find(t => t.userId === input.userId && t.name === 'Read' && t.isSystem);
    if (!tag) {
      tag = { id: createId(), userId: input.userId, name: 'Read', isSystem: true };
      inMemoryStore.tags.push(tag);
    }
    
    if (!inMemoryStore.entryTags.some(et => et.entryId === input.entryId && et.tagId === tag!.id)) {
      inMemoryStore.entryTags.push({ entryId: input.entryId, tagId: tag.id });
    }
  }

  async markAsUnread(input: {
    userId: string;
    entryId: string;
  }): Promise<void> {
    const tag = inMemoryStore.tags.find(t => t.userId === input.userId && t.name === 'Read' && t.isSystem);
    if (tag) {
      inMemoryStore.entryTags = inMemoryStore.entryTags.filter(
        et => !(et.entryId === input.entryId && et.tagId === tag.id)
      );
    }
  }

  async toggleBookmark(input: {
    userId: string;
    entryId: string;
    isBookmarked: boolean;
  }): Promise<void> {
    let tag = inMemoryStore.tags.find(t => t.userId === input.userId && t.name === 'Bookmark' && t.isSystem);
    if (!tag) {
      tag = { id: createId(), userId: input.userId, name: 'Bookmark', isSystem: true };
      inMemoryStore.tags.push(tag);
    }
    
    if (input.isBookmarked) {
      if (!inMemoryStore.entryTags.some(et => et.entryId === input.entryId && et.tagId === tag!.id)) {
        inMemoryStore.entryTags.push({ entryId: input.entryId, tagId: tag.id });
      }
    } else {
      inMemoryStore.entryTags = inMemoryStore.entryTags.filter(
        et => !(et.entryId === input.entryId && et.tagId === tag!.id)
      );
    }
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

  async updateSummary(input: {
    entryId: string;
    summary: string;
  }): Promise<Entry> {
    const entry = inMemoryStore.entries.find(
      (item) => item.id === input.entryId,
    );
    if (!entry) {
      throw new Error(`Entry ${input.entryId} not found`);
    }

    entry.summary = input.summary;
    return entry;
  }


}
