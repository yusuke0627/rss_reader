import type {
  EntryRepository,
  FeedRepository,
  FolderRepository,
  SearchRepository,
  TagRepository,
  UserRepository,
} from "@/application/ports";
import { TursoEntryRepository } from "./turso-entry-repository";
import { TursoFeedRepository } from "./turso-feed-repository";
import { TursoFolderRepository } from "./turso-folder-repository";
import { TursoSearchRepository } from "./turso-search-repository";
import { TursoTagRepository } from "./turso-tag-repository";
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
  // 常に Turso実装（リモートまたはローカルSQLiteファイル）を使用する
  return {
    feedRepository: new TursoFeedRepository(),
    entryRepository: new TursoEntryRepository(),
    userRepository: new TursoUserRepository(),
    searchRepository: new TursoSearchRepository(),
    folderRepository: new TursoFolderRepository(),
    tagRepository: new TursoTagRepository(),
  };
}
