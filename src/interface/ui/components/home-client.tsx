"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useFeedFormStore } from "@/interface/ui/stores/feed-form-store";

interface EntryItem {
  id: string;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string | null;
  summary?: string | null;
}

interface EntriesResponse {
  entries: EntryItem[];
}

class UnauthorizedApiError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedApiError";
  }
}

async function fetchEntries(input: {
  unreadOnly: boolean;
  search: string;
}): Promise<EntriesResponse> {
  const params = new URLSearchParams();
  if (input.unreadOnly) {
    params.set("unread", "1");
  }
  if (input.search.trim()) {
    params.set("search", input.search.trim());
  }

  const response = await fetch(`/api/entries?${params.toString()}`);
  if (response.status === 401) {
    throw new UnauthorizedApiError();
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch entries");
  }
  return response.json() as Promise<EntriesResponse>;
}

async function createFeed(url: string): Promise<void> {
  const response = await fetch("/api/feeds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (response.status === 401) {
    throw new UnauthorizedApiError();
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to register feed");
  }
}

async function postEntryAction(entryId: string, action: "read" | "unread" | "bookmark" | "unbookmark") {
  const response = await fetch(`/api/entries/${entryId}/${action}`, { method: "POST" });
  if (response.status === 401) {
    throw new UnauthorizedApiError();
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to ${action}`);
  }
}

async function postSummarize(entryId: string) {
  const response = await fetch(`/api/entries/${entryId}/summarize`, { method: "POST" });
  if (response.status === 401) {
    throw new UnauthorizedApiError();
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to summarize`);
  }
  return response.json() as Promise<EntryItem>;
}

export function HomeClient() {
  const queryClient = useQueryClient();
  const { draftUrl, setDraftUrl, clear } = useFeedFormStore();

  // UIローカル状態（検索条件や操作中のentry）は React state で管理。
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  // summaries キャッシュ: entryId -> summaryText|null
  // これは UI 側の即時表示用キャッシュ。サーバの entry.summary と併用します。
  const [summaries, setSummaries] = useState<Record<string, string | null>>({});

  // Server state は TanStack Query で管理する。
  const entriesQuery = useQuery({
    queryKey: ["entries", { unreadOnly, search }],
    queryFn: () => fetchEntries({ unreadOnly, search }),
  });

  const createFeedMutation = useMutation({
    mutationFn: createFeed,
    onSuccess: async () => {
      clear();
      // Feed追加後は一覧を再取得して表示を同期する。
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  const entryActionMutation = useMutation({
    mutationFn: async (input: {
      entryId: string;
      action: "read" | "unread" | "bookmark" | "unbookmark";
    }) => {
      setActiveEntryId(input.entryId);
      await postEntryAction(input.entryId, input.action);
    },
    onSuccess: async () => {
      // read/bookmark 操作後も一覧を再取得する。
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onSettled: () => {
      setActiveEntryId(null);
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (entryId: string) => {
      setActiveEntryId(entryId);
      return await postSummarize(entryId);
    },
    onSuccess: async (entry) => {
      // サーバが更新済みの Entry を返す想定（summary を含む）
      if (entry && entry.id) {
        setSummaries((s) => ({ ...s, [entry.id]: entry.summary ?? null }));
      }
      // 一覧に summary が反映される可能性があるので再取得
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onSettled: () => {
      setActiveEntryId(null);
    },
  });

  const unauthorized = entriesQuery.error instanceof UnauthorizedApiError;
  const errorMessage = useMemo(() => {
    if (entriesQuery.error && !(entriesQuery.error instanceof UnauthorizedApiError)) {
      return entriesQuery.error.message;
    }
    if (createFeedMutation.error && !(createFeedMutation.error instanceof UnauthorizedApiError)) {
      return createFeedMutation.error.message;
    }
    if (entryActionMutation.error && !(entryActionMutation.error instanceof UnauthorizedApiError)) {
      return entryActionMutation.error.message;
    }
    if (summarizeMutation.error && !(summarizeMutation.error instanceof UnauthorizedApiError)) {
      return summarizeMutation.error.message;
    }
    return null;
  }, [createFeedMutation.error, entriesQuery.error, entryActionMutation.error, summarizeMutation.error]);

  return (
    <section className="w-full space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">RSS Reader</h1>
        <p className="mt-2 text-sm text-slate-600">Minimal verification UI for feeds and entries.</p>
      </header>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900">1) Register Feed</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="https://example.com/feed.xml"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => createFeedMutation.mutate(draftUrl)}
            disabled={!draftUrl.trim() || createFeedMutation.isPending}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {createFeedMutation.isPending ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900">2) Entries</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search title/content"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-80"
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            unread only
          </label>
          <button
            type="button"
            onClick={() => entriesQuery.refetch()}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Refresh
          </button>
        </div>

        {unauthorized ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Sign in is required. Open{" "}
            <Link className="underline" href="/api/auth/signin">
              /api/auth/signin
            </Link>
            .
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-700">{errorMessage}</p>
        ) : null}

        <ul className="mt-4 space-y-2">
          {entriesQuery.isLoading ? (
            <li className="text-sm text-slate-600">Loading entries...</li>
          ) : null}

          {!entriesQuery.isLoading && (entriesQuery.data?.entries.length ?? 0) === 0 ? (
            <li className="text-sm text-slate-600">No entries found.</li>
          ) : null}

          {entriesQuery.data?.entries.map((entry) => (
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
                <div className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700">
                  {(summaries[entry.id] ?? entry.summary) ?? ""}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {(["read", "unread", "bookmark", "unbookmark"] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => entryActionMutation.mutate({ entryId: entry.id, action })}
                    disabled={entryActionMutation.isPending && activeEntryId === entry.id}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs uppercase"
                  >
                    {action}
                  </button>
                ))}

                {/* 要約ボタン */}
                <button
                  type="button"
                  onClick={() => summarizeMutation.mutate(entry.id)}
                  disabled={summarizeMutation.isPending && activeEntryId === entry.id}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  {summarizeMutation.isPending && activeEntryId === entry.id ? "Summarizing..." : "Summarize"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
