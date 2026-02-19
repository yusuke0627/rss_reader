import type {
  CreateFeedInput,
  FeedRepository,
  UpsertFeedMetadataInput,
} from "@/application/ports";
import type { Feed, Subscription } from "@/domain/entities";
import { createId, inMemoryStore } from "./in-memory-store";

export class InMemoryFeedRepository implements FeedRepository {
  async findById(id: string): Promise<Feed | null> {
    return inMemoryStore.feeds.find((feed) => feed.id === id) ?? null;
  }

  async findByUrl(url: string): Promise<Feed | null> {
    return inMemoryStore.feeds.find((feed) => feed.url === url) ?? null;
  }

  async create(input: CreateFeedInput): Promise<Feed> {
    const existing = await this.findByUrl(input.url);
    if (existing) {
      return existing;
    }

    const feed: Feed = {
      id: createId(),
      url: input.url,
      title: input.title,
      siteUrl: input.siteUrl ?? null,
      etag: null,
      lastModified: null,
      lastFetchedAt: null,
    };

    inMemoryStore.feeds.push(feed);
    return feed;
  }

  async deleteById(id: string): Promise<void> {
    inMemoryStore.feeds = inMemoryStore.feeds.filter((feed) => feed.id !== id);
    inMemoryStore.subscriptions = inMemoryStore.subscriptions.filter(
      (subscription) => subscription.feedId !== id,
    );
    inMemoryStore.entries = inMemoryStore.entries.filter((entry) => entry.feedId !== id);
  }

  async listByUserId(userId: string): Promise<Feed[]> {
    const feedIds = new Set(
      inMemoryStore.subscriptions
        .filter((subscription) => subscription.userId === userId)
        .map((subscription) => subscription.feedId),
    );
    return inMemoryStore.feeds.filter((feed) => feedIds.has(feed.id));
  }

  async createSubscription(input: {
    userId: string;
    feedId: string;
    folderId?: string | null;
  }): Promise<Subscription> {
    // UNIQUE(user_id, feed_id) を想定し、同一購読は再利用する。
    const existing = inMemoryStore.subscriptions.find(
      (subscription) =>
        subscription.userId === input.userId && subscription.feedId === input.feedId,
    );
    if (existing) {
      return existing;
    }

    const subscription: Subscription = {
      id: createId(),
      userId: input.userId,
      feedId: input.feedId,
      folderId: input.folderId ?? null,
      createdAt: new Date(),
    };

    inMemoryStore.subscriptions.push(subscription);
    return subscription;
  }

  async deleteSubscription(input: { userId: string; feedId: string }): Promise<void> {
    inMemoryStore.subscriptions = inMemoryStore.subscriptions.filter(
      (subscription) =>
        !(subscription.userId === input.userId && subscription.feedId === input.feedId),
    );
  }

  async updateSubscriptionFolder(input: {
    userId: string;
    feedId: string;
    folderId: string | null;
  }): Promise<void> {
    const subscription = inMemoryStore.subscriptions.find(
      (item) => item.userId === input.userId && item.feedId === input.feedId,
    );
    if (!subscription) {
      return;
    }
    subscription.folderId = input.folderId;
  }

  async listStaleFeeds(limit: number): Promise<Feed[]> {
    return [...inMemoryStore.feeds]
      .sort((a, b) => {
        if (!a.lastFetchedAt && !b.lastFetchedAt) return 0;
        if (!a.lastFetchedAt) return -1;
        if (!b.lastFetchedAt) return 1;
        return a.lastFetchedAt.getTime() - b.lastFetchedAt.getTime();
      })
      .slice(0, limit);
  }

  async updateFetchMetadata(input: UpsertFeedMetadataInput): Promise<void> {
    const feed = inMemoryStore.feeds.find((item) => item.id === input.feedId);
    if (!feed) {
      return;
    }

    feed.etag = input.etag ?? null;
    feed.lastModified = input.lastModified ?? null;
    feed.lastFetchedAt = input.lastFetchedAt;
  }
}
