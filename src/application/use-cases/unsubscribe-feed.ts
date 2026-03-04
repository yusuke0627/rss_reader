import type { FeedRepository } from "../ports";

export interface UnsubscribeFeedInput {
  userId: string;
  feedId: string;
}

export interface UnsubscribeFeedDependencies {
  feedRepository: FeedRepository;
}

export class UnsubscribeFeed {
  constructor(private readonly deps: UnsubscribeFeedDependencies) {}

  async execute(input: UnsubscribeFeedInput): Promise<void> {
    // ユーザーの購読情報を削除します。
    // Feed自体は他のユーザーも購読している可能性があるため削除しません。
    await this.deps.feedRepository.deleteSubscription({
      userId: input.userId,
      feedId: input.feedId,
    });
  }
}
