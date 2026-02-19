export interface FetchFeedInput {
  url: string;
  etag?: string | null;
  lastModified?: string | null;
}

export interface FetchedFeed {
  title: string;
  siteUrl?: string | null;
  etag?: string | null;
  lastModified?: string | null;
  entries: Array<{
    guid: string;
    title: string;
    url: string;
    content?: string | null;
    publishedAt?: Date | null;
    author?: string | null;
  }>;
  notModified: boolean;
}

export interface RssFetcher {
  fetchFeed(input: FetchFeedInput): Promise<FetchedFeed>;
}
