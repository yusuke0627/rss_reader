import {
  MarkEntryRead,
  MarkEntryUnread,
  RegisterFeed,
  SearchEntries,
  ToggleBookmark,
  GetPublicEntries,
  ImportOpml,
  ExportOpml,
  SyncFeeds,
  SyncUser,
} from "@/application/use-cases";
import { OpmlServiceImpl } from "@/infrastructure/rss/opml-service-impl";
import { createRepositories } from "@/infrastructure/db";
import { RssFetcherHttp } from "@/infrastructure/rss/rss-fetcher-http";

// route.ts から use case を作る入口。
// 依存注入ポイントを1箇所に寄せることで、各routeの責務を薄く保つ。
const repositories = createRepositories();

const rssFetcher = new RssFetcherHttp();
const opmlService = new OpmlServiceImpl();

export function createRegisterFeedUseCase(): RegisterFeed {
  return new RegisterFeed({
    feedRepository: repositories.feedRepository,
    entryRepository: repositories.entryRepository,
    rssFetcher,
    searchRepository: repositories.searchRepository,
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

export function createImportOpmlUseCase(): ImportOpml {
  return new ImportOpml({
    opmlService,
    feedRepository: repositories.feedRepository,
    folderRepository: repositories.folderRepository,
  });
}

export function createExportOpmlUseCase(): ExportOpml {
  return new ExportOpml({
    opmlService,
    feedRepository: repositories.feedRepository,
  });
}
export function createSyncFeedsUseCase(): SyncFeeds {
  return new SyncFeeds({
    feedRepository: repositories.feedRepository,
    entryRepository: repositories.entryRepository,
    rssFetcher,
    searchRepository: repositories.searchRepository,
  });
}

export function createSyncUserUseCase(): SyncUser {
  return new SyncUser({
    userRepository: repositories.userRepository,
  });
}
