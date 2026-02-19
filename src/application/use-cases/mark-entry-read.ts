import type { UserEntry } from "@/domain/entities";
import type { EntryRepository } from "@/application/ports";

export interface MarkEntryReadInput {
  userId: string;
  entryId: string;
  readAt?: Date;
}

export class EntryNotFoundError extends Error {
  constructor(entryId: string) {
    super(`Entry not found: ${entryId}`);
    this.name = "EntryNotFoundError";
  }
}

export interface MarkEntryReadDependencies {
  entryRepository: EntryRepository;
}

export class MarkEntryRead {
  constructor(private readonly deps: MarkEntryReadDependencies) {}

  async execute(input: MarkEntryReadInput): Promise<UserEntry> {
    // 自分がアクセス可能なentryかを先に検証する。
    const entry = await this.deps.entryRepository.findByIdForUser({
      userId: input.userId,
      entryId: input.entryId,
    });

    if (!entry) {
      throw new EntryNotFoundError(input.entryId);
    }

    // user_entry の冪等upsertは repository 側に任せる。
    return this.deps.entryRepository.markAsRead({
      userId: input.userId,
      entryId: input.entryId,
      readAt: input.readAt ?? new Date(),
    });
  }
}
