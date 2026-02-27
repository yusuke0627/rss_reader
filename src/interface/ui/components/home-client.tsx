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
  const [activeEntry, setActiveEntry] = useState<EntryItemType | null>(null);

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
    mutationFn: async (input: {
      entryId: string;
      action: "read" | "unread" | "bookmark" | "unbookmark";
    }) => {
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
      // Update active entry state to reflect summary immediately
      if (activeEntry?.id === newEntry.id) {
        setActiveEntry(newEntry);
      }
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  const clearErrorMessages = () => {
    createFeedMutation.reset();
    entryActionMutation.reset();
    summarizeMutation.reset();
  }

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


  // Find actual updated entry from query data if exists
  const currentEntry = useMemo(() => {
    if (!activeEntry) return null;
    return entriesQuery.data?.entries.find(e => e.id === activeEntry.id) || activeEntry;
  }, [activeEntry, entriesQuery.data]);

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden text-slate-200">

      {/* 1. Left Sidebar Pane */}
      <Sidebar
        onAddFeed={(url) => createFeedMutation.mutate(url)}
        isAdding={createFeedMutation.isPending}
        onClear={clear}
      />

      {/* 2. Middle List Pane */}
      <div className="w-[400px] shrink-0 h-full flex flex-col z-10 shadow-2xl shadow-black/50">
        {errorMessage && (
          <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-4 text-sm m-4 rounded-r-md">
            {errorMessage}
          </div>
        )}
        {unauthorized && (
          <div className="bg-amber-500/10 border-l-4 border-amber-500 text-amber-400 p-4 text-sm m-4 rounded-r-md flex flex-col gap-2">
            <span>Authentication required.</span>
            <a
              href="/api/auth/signin"
              className="inline-flex w-max items-center font-medium text-amber-300 hover:text-amber-200 underline underline-offset-2 transition-colors"
            >
              Go to Sign In →
            </a>
          </div>
        )}
        <EntryList
          entries={entriesQuery.data?.entries ?? []}
          isLoading={entriesQuery.isLoading}
          activeEntryId={activeEntry?.id ?? null}
          onSelectEntry={setActiveEntry}
          search={search}
          onSearchChange={setSearch}
          unreadOnly={unreadOnly}
          onUnreadOnlyChange={setUnreadOnly}
          onRefresh={() => entriesQuery.refetch()}
        />
      </div>

      {/* 3. Right Detail Pane */}
      <div className="flex-1 h-full z-0 relative">
        <EntryDetail
          entry={currentEntry}
          onSummarize={(id) => summarizeMutation.mutate(id)}
          isSummarizePending={summarizeMutation.isPending}
          onAction={(id, action) => entryActionMutation.mutate({ entryId: id, action })}
          isActionPending={entryActionMutation.isPending}
        />
      </div>

    </div>
  );
}
