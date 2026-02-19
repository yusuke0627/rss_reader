"use client";

import { useQuery } from "@tanstack/react-query";
import { useFeedFormStore } from "@/interface/ui/stores/feed-form-store";

interface HealthResponse {
  ok: boolean;
  now: string;
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    throw new Error("Failed to fetch health");
  }
  return response.json() as Promise<HealthResponse>;
}

export function HomeClient() {
  const { draftUrl, setDraftUrl, clear } = useFeedFormStore();
  const health = useQuery({ queryKey: ["health"], queryFn: fetchHealth });

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">RSS Reader</h1>
      <p className="mt-3 text-slate-600">Tailwind + Zustand + TanStack Query + Zod ready.</p>

      <div className="mt-6 space-y-2 text-sm text-slate-600">
        <p>Status: {health.isLoading ? "loading..." : health.data?.ok ? "ok" : "error"}</p>
        <p>Server time: {health.data?.now ?? "-"}</p>
      </div>

      <div className="mt-6 flex gap-2">
        <input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          placeholder="https://example.com/feed.xml"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={clear}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          Clear
        </button>
      </div>
    </section>
  );
}
