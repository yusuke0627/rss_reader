import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface EntryItemProps {
  entry: EntryItemType;
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

// ボタン用スピナー
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// 要約エリア用スケルトン
const SummarySkeleton = () => (
  <div className="mt-2 rounded bg-slate-50 p-3 animate-pulse space-y-2">
    <div className="h-2 bg-slate-200 rounded w-full"></div>
    <div className="h-2 bg-slate-200 rounded w-5/6"></div>
    <div className="h-2 bg-slate-200 rounded w-4/6"></div>
  </div>
);

// 各記事ごとのcomponent
export function EntryItem({
  entry,
  activeEntryId,
  onAction,
  onSummarize,
  isActionPending,
  isSummarizePending,
}: EntryItemProps) {
  const isCurrentActive = activeEntryId === entry.id;

  return (
    <li className="rounded-md border border-slate-200 p-3">
      <a href={entry.url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline">
        {entry.title}
      </a>
      <p className="mt-1 text-xs text-slate-500">
        {entry.author ?? "Unknown author"}
        {entry.publishedAt ? ` / ${new Date(entry.publishedAt).toLocaleString()}` : ""}
      </p>

      {/* 要約表示（ローディング中はスケルトンを表示） */}
      {isSummarizePending && isCurrentActive ? (
        <SummarySkeleton />
      ) : entry.summary ? (
        <div className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700 prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {entry.summary}
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

        {/* 要約ボタン（ローディング中はスピナーを表示） */}
        <button
          type="button"
          onClick={() => onSummarize(entry.id)}
          disabled={isSummarizePending && isCurrentActive}
          className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {isSummarizePending && isCurrentActive ? (
            <>
              <Spinner />
              Summarizing...
            </>
          ) : (
            "Summarize"
          )}
        </button>
      </div>
    </li>
  );
}
