"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFeedFormStore } from "@/interface/ui/stores/feed-form-store";
import { Sidebar } from "./sidebar";
import { EntryList, type EntryItemType } from "./entry-list";
import { EntryDetail } from "./entry-detail";

interface EntriesResponse {
  entries: EntryItemType[];
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
  if (response.status === 401) throw new UnauthorizedApiError();
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
  if (response.status === 401) throw new UnauthorizedApiError();
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to register feed");
  }
}

async function postEntryAction(entryId: string, action: "read" | "unread" | "bookmark" | "unbookmark") {
  const response = await fetch(`/api/entries/${entryId}/${action}`, { method: "POST" });
  if (response.status === 401) throw new UnauthorizedApiError();
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to ${action}`);
  }
}

async function postSummarize(entryId: string) {
  const response = await fetch(`/api/entries/${entryId}/summarize`, { method: "POST" });
  if (response.status === 401) throw new UnauthorizedApiError();
  if (response.status === 429) {
    throw new Error("Api Rate limit exceeded. Please try again later.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to summarize`);
  }
  return response.json() as Promise<EntryItemType>;
}

export function HomeClient() {
  const queryClient = useQueryClient();
  const { clear } = useFeedFormStore();

  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const entriesQuery = useQuery({
    queryKey: ["entries", { unreadOnly, search }],
    queryFn: () => fetchEntries({ unreadOnly, search }),
  });

  const createFeedMutation = useMutation({
    mutationFn: createFeed,
    onSuccess: async () => {
      clearErrorMessages();
      clear();
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  const entryActionMutation = useMutation({
    mutationFn: async (input: { entryId: string; action: "read" | "unread" | "bookmark" | "unbookmark" }) => {
      await postEntryAction(input.entryId, input.action);
    },
    onSuccess: async () => {
      clearErrorMessages();
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return await postSummarize(entryId);
    },
    onSuccess: async (newEntry) => {
      clearErrorMessages();
      queryClient.setQueryData(["entries", { unreadOnly, search }], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((e: any) =>
            e.id === newEntry.id ? { ...e, summary: newEntry.summary } : e
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  const clearErrorMessages = () => {
    createFeedMutation.reset();
    entryActionMutation.reset();
    summarizeMutation.reset();
  };

  const errorMessage = useMemo(() => {
    if (entriesQuery.error && !(entriesQuery.error instanceof UnauthorizedApiError)) return entriesQuery.error.message;
    if (createFeedMutation.error && !(createFeedMutation.error instanceof UnauthorizedApiError)) return createFeedMutation.error.message;
    if (entryActionMutation.error && !(entryActionMutation.error instanceof UnauthorizedApiError)) return entryActionMutation.error.message;
    if (summarizeMutation.error && !(summarizeMutation.error instanceof UnauthorizedApiError)) return summarizeMutation.error.message;
    return null;
  }, [createFeedMutation.error, entriesQuery.error, entryActionMutation.error, summarizeMutation.error]);

  const activeEntry = useMemo(
    () => entriesQuery.data?.entries.find((e) => e.id === activeEntryId) || null,
    [activeEntryId, entriesQuery.data?.entries]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 1. Left Sidebar Navigation */}
      <div className="flex-shrink-0">
        <Sidebar
          onAddFeed={(url) => createFeedMutation.mutate(url)}
          isAdding={createFeedMutation.isPending}
          onClear={clear}
        />
      </div>

      {/* 2. Middle Article List */}
      <div className="w-[400px] flex-shrink-0 flex flex-col h-full relative">
        <EntryList
          entries={entriesQuery.data?.entries || []}
          isLoading={entriesQuery.isLoading}
          activeEntryId={activeEntryId}
          onSelectEntry={(entry) => setActiveEntryId(entry.id)}
          search={search}
          onSearchChange={setSearch}
          unreadOnly={unreadOnly}
          onUnreadOnlyChange={setUnreadOnly}
          onRefresh={() => entriesQuery.refetch()}
        />
      </div>

      {/* 3. Right Article Details */}
      <div className="flex-1 min-w-0 flex flex-col h-full relative">
        {errorMessage && (
          <div className="absolute top-4 right-4 z-50 w-full max-w-sm rounded-2xl p-4 shadow-lg flex justify-between items-start m3-state-layer bg-m3-error-container text-m3-on-error-container">
            <span className="text-sm font-medium">{errorMessage}</span>
            <button onClick={clearErrorMessages} className="text-m3-on-error-container/70 hover:text-m3-on-error-container ml-3 p-1 rounded-full m3-state-layer">
              ✕
            </button>
          </div>
        )}
        <EntryDetail
          entry={activeEntry}
          onSummarize={(id) => summarizeMutation.mutate(id)}
          isSummarizePending={summarizeMutation.isPending}
          onAction={(id, action) => entryActionMutation.mutate({ entryId: id, action })}
          isActionPending={entryActionMutation.isPending}
        />
      </div>
    </div>
  );
}
