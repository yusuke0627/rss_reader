import type {
  EntryRepository,
  FeedRepository,
  RssFetcher,
  SearchRepository,
} from "@/application/ports";

export interface SyncFeedsResult {
  processedFeedCount: number;
  newEntryCount: number;
  errors: Array<{ feedUrl: string; error: string }>;
}

export interface SyncFeedsDependencies {
  feedRepository: FeedRepository;
  entryRepository: EntryRepository;
  rssFetcher: RssFetcher;
  searchRepository: SearchRepository;
}

export interface SyncFeedsOptions {
  limit?: number;
}

export class SyncFeeds {
  constructor(private readonly deps: SyncFeedsDependencies) {}

  async execute(options: SyncFeedsOptions = {}): Promise<SyncFeedsResult> {
    const limit = options.limit ?? 10;
    const staleFeeds = await this.deps.feedRepository.listStaleFeeds(limit);

    const result: SyncFeedsResult = {
      processedFeedCount: 0,
      newEntryCount: 0,
      errors: [],
    };

    for (const feed of staleFeeds) {
      try {
        const fetched = await this.deps.rssFetcher.fetchFeed({
          url: feed.url,
          etag: feed.etag,
          lastModified: feed.lastModified,
        });

        if (!fetched.notModified && fetched.entries.length > 0) {
          const insertedEntryIds =
            await this.deps.entryRepository.saveFetchedEntries({
              feedId: feed.id,
              entries: fetched.entries,
            });

          if (insertedEntryIds.length > 0) {
            await this.deps.searchRepository.indexEntries(insertedEntryIds);
            result.newEntryCount += insertedEntryIds.length;
          }
        }

        // メタ情報を更新（差分がなくても最終確認日時を更新する）
        await this.deps.feedRepository.updateFetchMetadata({
          feedId: feed.id,
          etag: fetched.etag ?? feed.etag, // 304の時も返ってくる場合は更新、なければ維持
          lastModified: fetched.lastModified ?? feed.lastModified,
          lastFetchedAt: new Date(),
        });

        result.processedFeedCount++;
      } catch (error) {
        result.errors.push({
          feedUrl: feed.url,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }
}
