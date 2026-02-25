import { Entry } from "@/domain/entities/entry";
import { EntryRepository, Summarizer } from "../ports";

interface SummarizeEntryInput {
  userId: string;
  entryId: string;
}

/**
 * 記事の要約を取得・生成する UseCase。
 * 1. すでに要約が存在する場合は、DBから取得した値をそのまま返却する（AI実行コスト抑制）。
 * 2. 要約が存在しない場合は、Summarizer を使用して生成し、DBに保存してから返却する。
 */
export class SummarizeEntry {
  constructor(
    private readonly dependencies: {
      entryRepository: EntryRepository;
      summarizer: Summarizer;
    },
  ) {}

  async execute(input: SummarizeEntryInput): Promise<Entry> {
    const { entryRepository, summarizer } = this.dependencies;

    // 1. 記事の存在確認と権限チェック
    const entry = await entryRepository.findByIdForUser({
      userId: input.userId,
      entryId: input.entryId,
    });
    if (!entry) {
      throw new Error("Entry not found or access denied");
    }

    // 2. すでに要約がある場合は、それをそのまま返す
    if (entry.summary) {
      return entry;
    }

    // 3. 要約を生成する
    // 本文が空の場合はタイトルの要約を試みる
    const contentToSummarize = entry.content || entry.title;
    const summary = await summarizer.summarize(contentToSummarize);

    // 4. 生成した要約を保存する
    const updatedEntry = await entryRepository.updateSummary({
      entryId: input.entryId,
      summary,
    });

    return updatedEntry;
  }
}
