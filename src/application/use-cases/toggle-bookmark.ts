import type { UserEntry } from "@/domain/entities";
import type { EntryRepository } from "@/application/ports";
import { EntryNotFoundError } from "./mark-entry-read";

export interface ToggleBookmarkInput {
  userId: string;
  entryId: string;
  isBookmarked: boolean;
}

export interface ToggleBookmarkDependencies {
  entryRepository: EntryRepository;
}

export class ToggleBookmark {
  constructor(private readonly deps: ToggleBookmarkDependencies) {}

  async execute(input: ToggleBookmarkInput): Promise<UserEntry> {
    // 他人のentryを更新できないよう、対象の所属を検証する。
    const entry = await this.deps.entryRepository.findByIdForUser({
      userId: input.userId,
      entryId: input.entryId,
    });

    if (!entry) {
      throw new EntryNotFoundError(input.entryId);
    }

    return this.deps.entryRepository.toggleBookmark({
      userId: input.userId,
      entryId: input.entryId,
      isBookmarked: input.isBookmarked,
    });
  }
}
