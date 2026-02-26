import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface EntryItemProps {
  entry: EntryItemType;
  summaries: Record<string, string | null>;
  activeEntryId: string | null;
  // call entryActionMutation.mutate
  onAction: (entryId: string, action: "read" | "unread" | "bookmark" | "unbookmark") => void;
  // call summarizeMutation.mutate
  onSummarize: (entryId: string) => void;

  isActionPending: boolean;
  isSummarizePending: boolean;
}

interface EntryItemType {
  id: string;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string | null;
  summary?: string | null;
}

// 各記事ごとのcomponent
export function EntryItem({
  entry,
  summaries,
  activeEntryId,
  onAction,
  onSummarize,
  isActionPending,
  isSummarizePending,
}: EntryItemProps) {
  const isCurrentActive = activeEntryId === entry.id;

  return (
    <li key={entry.id} className="rounded-md border border-slate-200 p-3">
      <a href={entry.url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline">
        {entry.title}
      </a>
      <p className="mt-1 text-xs text-slate-500">
        {entry.author ?? "Unknown author"}
        {entry.publishedAt ? ` / ${new Date(entry.publishedAt).toLocaleString()}` : ""}
      </p>

      {/* 要約表示（UIキャッシュ or サーバ返却分） */}
      {(summaries[entry.id] ?? entry.summary) ? (
        <div className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700 prose prose-slate max-w-none">

          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {(summaries[entry.id] ?? entry.summary) ?? ""}
          </ReactMarkdown>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {(["read", "unread", "bookmark", "unbookmark"] as const).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction(entry.id, action)}
            disabled={isActionPending && isCurrentActive}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs uppercase"
          >
            {action}
          </button>
        ))}

        {/* 要約ボタン */}
        <button
          type="button"
          onClick={() => onSummarize(entry.id)}
          disabled={isSummarizePending && isCurrentActive}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {isSummarizePending && isCurrentActive ? "Summarizing..." : "Summarize"}
        </button>
      </div>
    </li>
  );
}
