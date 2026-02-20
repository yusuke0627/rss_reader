import type { FeedRepository, OpmlService } from "@/application/ports";

export interface ExportOpmlInput {
  userId: string;
}

export interface ExportOpmlDependencies {
  opmlService: OpmlService;
  feedRepository: FeedRepository;
}

export class ExportOpml {
  constructor(private readonly deps: ExportOpmlDependencies) {}

  async execute(input: ExportOpmlInput): Promise<string> {
    // Get user's feeds
    const feeds = await this.deps.feedRepository.listByUserId(input.userId);

    // Filter out minimal details needed for OPML
    const opmlFeeds = feeds.map((f) => ({
      title: f.title,
      xmlUrl: f.url,
      htmlUrl: f.siteUrl || undefined,
    }));

    // Build XML
    return this.deps.opmlService.build(opmlFeeds);
  }
}
