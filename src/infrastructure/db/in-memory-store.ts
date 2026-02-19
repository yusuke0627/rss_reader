import type {
  Entry,
  Feed,
  PublicProfile,
  Subscription,
  UserEntry,
} from "@/domain/entities";

export interface InMemoryStore {
  feeds: Feed[];
  subscriptions: Subscription[];
  entries: Entry[];
  userEntries: UserEntry[];
  publicProfiles: PublicProfile[];
}

export const inMemoryStore: InMemoryStore = {
  feeds: [],
  subscriptions: [],
  entries: [],
  userEntries: [],
  publicProfiles: [],
};

export function createId(): string {
  return crypto.randomUUID();
}
