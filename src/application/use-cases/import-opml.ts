import type { Feed } from "@/domain/entities";
import type {
  FeedRepository,
  OpmlService,
} from "@/application/ports";

export interface ImportOpmlInput {
  userId: string;
  opmlContent: string;
}

export interface ImportOpmlResult {
  importedCount: number;
}

export interface ImportOpmlDependencies {
  opmlService: OpmlService;
  feedRepository: FeedRepository;
}

export class ImportOpml {
  constructor(private readonly deps: ImportOpmlDependencies) {}

  async execute(input: ImportOpmlInput): Promise<ImportOpmlResult> {
    // 1. Parse OPML content
    const parsedSubscriptions = await this.deps.opmlService.parse(
      input.opmlContent,
    );
    if (!parsedSubscriptions || parsedSubscriptions.length === 0) {
      return { importedCount: 0 };
    }

    let importedCount = 0;

    // 2. Process each subscription
    for (const sub of parsedSubscriptions) {
      if (!sub.xmlUrl) continue;

      try {

        // Get or Create Feed
        let feed: Feed | null = await this.deps.feedRepository.findByUrl(
          sub.xmlUrl,
        );
        //DBにfeedが存在しない
        if (!feed) {
          feed = await this.deps.feedRepository.create({
            url: sub.xmlUrl,
            title: sub.title || sub.xmlUrl,
            siteUrl: sub.htmlUrl || null,
          });
        }

        // Create subscription (handles duplicates gracefully via DB constraint)
        await this.deps.feedRepository.createSubscription({
          userId: input.userId,
          feedId: feed.id,
        });

        importedCount++;
      } catch (error) {
        console.error(`Failed to import feed ${sub.xmlUrl}:`, error);
        // Continue attempting to import other feeds even if one fails
      }
    }

    return { importedCount };
  }
}
