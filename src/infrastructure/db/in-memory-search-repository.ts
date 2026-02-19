import type { SearchEntriesInput, SearchRepository } from "@/application/ports";
import type { Entry } from "@/domain/entities";
import { inMemoryStore } from "./in-memory-store";

export class InMemorySearchRepository implements SearchRepository {
  async searchEntries(input: SearchEntriesInput): Promise<Entry[]> {
    const q = input.query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    const subscribedFeedIds = new Set(
      inMemoryStore.subscriptions
        .filter((subscription) => subscription.userId === input.userId)
        .map((subscription) => subscription.feedId),
    );

    if (input.folderId) {
      const folderFeedIds = new Set(
        inMemoryStore.subscriptions
          .filter(
            (subscription) =>
              subscription.userId === input.userId && subscription.folderId === input.folderId,
          )
          .map((subscription) => subscription.feedId),
      );
      for (const feedId of [...subscribedFeedIds]) {
        if (!folderFeedIds.has(feedId)) {
          subscribedFeedIds.delete(feedId);
        }
      }
    }

    const statesByEntryId = new Map(
      inMemoryStore.userEntries
        .filter((state) => state.userId === input.userId)
        .map((state) => [state.entryId, state]),
    );

    return inMemoryStore.entries
      .filter((entry) => subscribedFeedIds.has(entry.feedId))
      .filter((entry) => (input.feedId ? entry.feedId === input.feedId : true))
      .filter((entry) => {
        if (!input.tagId) return true;
        return inMemoryStore.entryTags.some(
          (entryTag) => entryTag.entryId === entry.id && entryTag.tagId === input.tagId,
        );
      })
      .filter((entry) => {
        if (!input.unreadOnly) return true;
        return !statesByEntryId.get(entry.id)?.isRead;
      })
      .filter((entry) => {
        const haystack = `${entry.title}\n${entry.content ?? ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime();
        const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime();
        return bTime - aTime;
      })
      .slice(0, input.limit ?? 50);
  }

  async indexEntries(entryIds: string[]): Promise<void> {
    // In-memory search uses entries directly and does not require indexing.
    void entryIds;
  }
}
