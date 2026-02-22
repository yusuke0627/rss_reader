import type { Entry } from "@/domain/entities";
import type { EntryRepository, UserRepository } from "@/application/ports";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// UseCaseの引数
export interface GetPublicEntriesInput {
  slug: string;
  limit?: number;
  cursor?: string;
}

export interface GetPublicEntriesDependencies {
  userRepository: UserRepository;
  entryRepository: EntryRepository;
}

export class GetPublicEntries {
  constructor(private readonly deps: GetPublicEntriesDependencies) {}

  async execute(input: GetPublicEntriesInput): Promise<Entry[]> {
    const profile = await this.deps.userRepository.findPublicProfileBySlug(
      input.slug,
    );

    if (!profile || profile.isPublic === false) {
      throw new NotFoundError(
        `Public profile not found or not active for slug: ${input.slug}`,
      );
    }

    return this.deps.entryRepository.listPublicEntriesBySlug({
      slug: input.slug,
      limit: input.limit,
      cursor: input.cursor,
    });
  }
}
