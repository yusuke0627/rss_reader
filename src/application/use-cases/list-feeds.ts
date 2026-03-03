import type { FeedRepository } from "../ports/feed-repository";
import type { Feed } from "@/domain/entities";

export interface ListFeedsInput {
  userId: string;
}

export class ListFeeds {
  constructor(private feedRepository: FeedRepository) {}

  async execute(input: ListFeedsInput): Promise<Feed[]> {
    return this.feedRepository.listByUserId(input.userId);
  }
}
