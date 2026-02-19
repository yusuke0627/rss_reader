import type { Feed, Subscription } from "@/domain/entities";

// UseCase から見た「フィード永続化」の契約。
// 実体は Turso 実装 / in-memory 実装で差し替える。
export interface CreateFeedInput {
  url: string;
  title: string;
  siteUrl?: string | null;
}

export interface UpsertFeedMetadataInput {
  feedId: string;
  etag?: string | null;
  lastModified?: string | null;
  lastFetchedAt: Date;
}

export interface FeedRepository {
  findById(id: string): Promise<Feed | null>;
  findByUrl(url: string): Promise<Feed | null>;
  create(input: CreateFeedInput): Promise<Feed>;
  deleteById(id: string): Promise<void>;
  listByUserId(userId: string): Promise<Feed[]>;
  createSubscription(input: {
    userId: string;
    feedId: string;
    folderId?: string | null;
  }): Promise<Subscription>;
  deleteSubscription(input: { userId: string; feedId: string }): Promise<void>;
  updateSubscriptionFolder(input: {
    userId: string;
    feedId: string;
    folderId: string | null;
  }): Promise<void>;
  listStaleFeeds(limit: number): Promise<Feed[]>;
  updateFetchMetadata(input: UpsertFeedMetadataInput): Promise<void>;
}
