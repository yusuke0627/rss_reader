import type { Feed, Subscription } from "@/domain/entities";
import type { EntryRepository, FeedRepository, RssFetcher } from "@/application/ports";

export interface RegisterFeedInput {
  userId: string;
  url: string;
  folderId?: string | null;
}

export interface RegisterFeedResult {
  feed: Feed;
  subscription: Subscription;
  insertedEntryCount: number;
}

export class InvalidFeedUrlError extends Error {
  constructor(url: string) {
    super(`Invalid feed URL: ${url}`);
    this.name = "InvalidFeedUrlError";
  }
}

export interface RegisterFeedDependencies {
  feedRepository: FeedRepository;
  entryRepository: EntryRepository;
  rssFetcher: RssFetcher;
}

export class RegisterFeed {
  constructor(private readonly deps: RegisterFeedDependencies) {}

  async execute(input: RegisterFeedInput): Promise<RegisterFeedResult> {
    // 1) URLを正規化して不正入力を早期に弾く。
    const normalizedUrl = this.normalizeUrl(input.url);

    // 2) 既存feedがあれば再利用、なければ新規作成。
    let feed = await this.deps.feedRepository.findByUrl(normalizedUrl);
    let fetched = null as Awaited<ReturnType<RssFetcher["fetchFeed"]>> | null;

    if (!feed) {
      fetched = await this.deps.rssFetcher.fetchFeed({ url: normalizedUrl });
      feed = await this.deps.feedRepository.create({
        url: normalizedUrl,
        title: fetched.title || normalizedUrl,
        siteUrl: fetched.siteUrl ?? null,
      });
    }

    // 3) ETag/Last-Modified を使って差分取得。
    fetched ??= await this.deps.rssFetcher.fetchFeed({
      url: feed.url,
      etag: feed.etag,
      lastModified: feed.lastModified,
    });

    // 4) 更新があるときのみ entries を保存。
    let insertedEntryCount = 0;
    if (!fetched.notModified && fetched.entries.length > 0) {
      insertedEntryCount = await this.deps.entryRepository.saveFetchedEntries({
        feedId: feed.id,
        entries: fetched.entries,
      });
    }

    // 5) 次回差分取得のために fetch メタ情報を更新。
    await this.deps.feedRepository.updateFetchMetadata({
      feedId: feed.id,
      etag: fetched.etag ?? null,
      lastModified: fetched.lastModified ?? null,
      lastFetchedAt: new Date(),
    });

    // 6) ユーザー購読を作成して完了。
    const subscription = await this.deps.feedRepository.createSubscription({
      userId: input.userId,
      feedId: feed.id,
      folderId: input.folderId ?? null,
    });

    return {
      feed,
      subscription,
      insertedEntryCount,
    };
  }

  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) {
      throw new InvalidFeedUrlError(url);
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new InvalidFeedUrlError(url);
      }
      return parsed.toString();
    } catch {
      throw new InvalidFeedUrlError(url);
    }
  }
}
