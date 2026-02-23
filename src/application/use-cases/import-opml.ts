import type { Feed } from "@/domain/entities";
import type {
  FeedRepository,
  FolderRepository,
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
  folderRepository: FolderRepository;
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

    // Load available folders for the user
    const existingFolders = await this.deps.folderRepository.listByUserId(
      input.userId,
    );
    const folderCache = new Map<string, string>(); // name -> id
    existingFolders.forEach((f) => folderCache.set(f.name, f.id));

    let importedCount = 0;

    // 2. Process each subscription
    for (const sub of parsedSubscriptions) {
      if (!sub.xmlUrl) continue;

      try {
        // Resolve or create folder
        let folderId: string | null = null;
        // フォルダ名がある
        if (sub.folderName) {
          // そのフォルダがすでに存在していれば再利用
          if (folderCache.has(sub.folderName)) {
            folderId = folderCache.get(sub.folderName) || null;
            //　新たなフォルダならば新規作成
          } else {
            const newFolder = await this.deps.folderRepository.create({
              userId: input.userId,
              name: sub.folderName,
            });
            folderCache.set(newFolder.name, newFolder.id);
            folderId = newFolder.id;
          }
        }

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
          folderId, // folderが存在しなければNull
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
