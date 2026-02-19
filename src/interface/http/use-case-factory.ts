import { MarkEntryRead, RegisterFeed } from "@/application/use-cases";
import { InMemoryEntryRepository } from "@/infrastructure/db/in-memory-entry-repository";
import { InMemoryFeedRepository } from "@/infrastructure/db/in-memory-feed-repository";
import { TursoEntryRepository } from "@/infrastructure/db/turso-entry-repository";
import { TursoFeedRepository } from "@/infrastructure/db/turso-feed-repository";
import { isTursoConfigured } from "@/infrastructure/db/turso-client";
import { RssFetcherHttp } from "@/infrastructure/rss/rss-fetcher-http";

const feedRepository = isTursoConfigured()
  ? new TursoFeedRepository()
  : new InMemoryFeedRepository();

const entryRepository = isTursoConfigured()
  ? new TursoEntryRepository()
  : new InMemoryEntryRepository();

const rssFetcher = new RssFetcherHttp();

export function createRegisterFeedUseCase(): RegisterFeed {
  return new RegisterFeed({
    feedRepository,
    entryRepository,
    rssFetcher,
  });
}

export function createMarkEntryReadUseCase(): MarkEntryRead {
  return new MarkEntryRead({
    entryRepository,
  });
}
