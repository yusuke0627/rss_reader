import type {
  EntryRepository,
  FeedRepository,
  FolderRepository,
  SearchRepository,
  TagRepository,
  UserRepository,
} from "@/application/ports";
import { InMemoryEntryRepository } from "./in-memory-entry-repository";
import { InMemoryFeedRepository } from "./in-memory-feed-repository";
import { InMemoryFolderRepository } from "./in-memory-folder-repository";
import { InMemorySearchRepository } from "./in-memory-search-repository";
import { InMemoryTagRepository } from "./in-memory-tag-repository";
import { InMemoryUserRepository } from "./in-memory-user-repository";
import { TursoEntryRepository } from "./turso-entry-repository";
import { TursoFeedRepository } from "./turso-feed-repository";
import { TursoFolderRepository } from "./turso-folder-repository";
import { TursoSearchRepository } from "./turso-search-repository";
import { TursoTagRepository } from "./turso-tag-repository";
import { isTursoConfigured } from "./turso-client";
import { TursoUserRepository } from "./turso-user-repository";

export interface RepositorySet {
  feedRepository: FeedRepository;
  entryRepository: EntryRepository;
  userRepository: UserRepository;
  searchRepository: SearchRepository;
  folderRepository: FolderRepository;
  tagRepository: TagRepository;
}

export function createRepositories(): RepositorySet {
  if (isTursoConfigured()) {
    return {
      feedRepository: new TursoFeedRepository(),
      entryRepository: new TursoEntryRepository(),
      userRepository: new TursoUserRepository(),
      searchRepository: new TursoSearchRepository(),
      folderRepository: new TursoFolderRepository(),
      tagRepository: new TursoTagRepository(),
    };
  }

  return {
    feedRepository: new InMemoryFeedRepository(),
    entryRepository: new InMemoryEntryRepository(),
    userRepository: new InMemoryUserRepository(),
    searchRepository: new InMemorySearchRepository(),
    folderRepository: new InMemoryFolderRepository(),
    tagRepository: new InMemoryTagRepository(),
  };
}
