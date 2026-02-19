import type {
  Entry,
  EntryTag,
  Feed,
  Folder,
  PublicProfile,
  Subscription,
  Tag,
  User,
  UserEntry,
} from "@/domain/entities";

export interface InMemoryStore {
  users: User[];
  feeds: Feed[];
  folders: Folder[];
  tags: Tag[];
  subscriptions: Subscription[];
  entries: Entry[];
  entryTags: EntryTag[];
  userEntries: UserEntry[];
  publicProfiles: PublicProfile[];
}

export const inMemoryStore: InMemoryStore = {
  users: [],
  feeds: [],
  folders: [],
  tags: [],
  subscriptions: [],
  entries: [],
  entryTags: [],
  userEntries: [],
  publicProfiles: [],
};

export function createId(): string {
  return crypto.randomUUID();
}
