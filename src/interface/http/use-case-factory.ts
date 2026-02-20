import {
  MarkEntryRead,
  MarkEntryUnread,
  RegisterFeed,
  SearchEntries,
  ToggleBookmark,
  GetPublicEntries,
} from "@/application/use-cases";
import { createRepositories } from "@/infrastructure/db";
import { RssFetcherHttp } from "@/infrastructure/rss/rss-fetcher-http";

// route.ts から use case を作る入口。
// 依存注入ポイントを1箇所に寄せることで、各routeの責務を薄く保つ。
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

export function createMarkEntryUnreadUseCase(): MarkEntryUnread {
  return new MarkEntryUnread({
    entryRepository: repositories.entryRepository,
  });
}

export function createToggleBookmarkUseCase(): ToggleBookmark {
  return new ToggleBookmark({
    entryRepository: repositories.entryRepository,
  });
}

export function createSearchEntriesUseCase(): SearchEntries {
  return new SearchEntries({
    entryRepository: repositories.entryRepository,
    searchRepository: repositories.searchRepository,
  });
}

export function createGetPublicEntriesUseCase(): GetPublicEntries {
  return new GetPublicEntries({
    userRepository: repositories.userRepository,
    entryRepository: repositories.entryRepository,
  });
}
