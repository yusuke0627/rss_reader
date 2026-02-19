import { MarkEntryRead, RegisterFeed } from "@/application/use-cases";
import { createRepositories } from "@/infrastructure/db";
import { RssFetcherHttp } from "@/infrastructure/rss/rss-fetcher-http";

const repositories = createRepositories();

const rssFetcher = new RssFetcherHttp();

export function createRegisterFeedUseCase(): RegisterFeed {
  return new RegisterFeed({
    feedRepository: repositories.feedRepository,
    entryRepository: repositories.entryRepository,
    rssFetcher,
  });
}

export function createMarkEntryReadUseCase(): MarkEntryRead {
  return new MarkEntryRead({
    entryRepository: repositories.entryRepository,
  });
}
