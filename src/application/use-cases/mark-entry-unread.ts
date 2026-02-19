import type { UserEntry } from "@/domain/entities";
import type { EntryRepository } from "@/application/ports";
import { EntryNotFoundError } from "./mark-entry-read";

export interface MarkEntryUnreadInput {
  userId: string;
  entryId: string;
}

export interface MarkEntryUnreadDependencies {
  entryRepository: EntryRepository;
}

export class MarkEntryUnread {
  constructor(private readonly deps: MarkEntryUnreadDependencies) {}

  async execute(input: MarkEntryUnreadInput): Promise<UserEntry> {
    const entry = await this.deps.entryRepository.findByIdForUser({
      userId: input.userId,
      entryId: input.entryId,
    });

    if (!entry) {
      throw new EntryNotFoundError(input.entryId);
    }

    return this.deps.entryRepository.markAsUnread({
      userId: input.userId,
      entryId: input.entryId,
    });
  }
}
