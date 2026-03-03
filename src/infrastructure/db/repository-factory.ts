import type {
  EntryRepository,
  FeedRepository,
  SearchRepository,
  TagRepository,
  UserRepository,
} from "@/application/ports";
import { TursoEntryRepository } from "./turso-entry-repository";
import { TursoFeedRepository } from "./turso-feed-repository";
import { TursoSearchRepository } from "./turso-search-repository";
import { TursoTagRepository } from "./turso-tag-repository";
import { TursoUserRepository } from "./turso-user-repository";

export interface RepositorySet {
  feedRepository: FeedRepository;
  entryRepository: EntryRepository;
  userRepository: UserRepository;
  searchRepository: SearchRepository;
  tagRepository: TagRepository;
}

export function createRepositories(): RepositorySet {
  // 常に Turso実装（リモートまたはローカルSQLiteファイル）を使用する
  return {
    feedRepository: new TursoFeedRepository(),
    entryRepository: new TursoEntryRepository(),
    userRepository: new TursoUserRepository(),
    searchRepository: new TursoSearchRepository(),
    tagRepository: new TursoTagRepository(),
  };
}
