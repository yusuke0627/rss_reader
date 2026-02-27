"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, ExternalLink, Bookmark, CheckCircle2, Circle } from "lucide-react";
import type { EntryItemType } from "./entry-list";
import { format } from "date-fns";

interface EntryDetailProps {
  entry: EntryItemType | null;
  onSummarize: (id: string) => void;
  isSummarizePending: boolean;
  onAction: (id: string, action: "read" | "unread" | "bookmark" | "unbookmark") => void;
  isActionPending: boolean;
}

const SummarySkeleton = () => (
  <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-8 animate-pulse">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-indigo-500/20" />
      <div className="h-4 w-32 bg-slate-700/50 rounded" />
    </div>
    <div className="space-y-3">
      <div className="h-3 bg-slate-700/30 rounded w-full" />
      <div className="h-3 bg-slate-700/30 rounded w-[90%]" />
      <div className="h-3 bg-slate-700/30 rounded w-[95%]" />
      <div className="h-3 bg-slate-700/30 rounded w-[80%]" />
      <div className="h-3 bg-slate-700/30 rounded w-full" />
    </div>
  </div>
);

export function EntryDetail({
  entry,
  onSummarize,
  isSummarizePending,
  onAction,
  isActionPending,
}: EntryDetailProps) {
  if (!entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
          <Sparkles className="text-indigo-500/50" size={24} />
        </div>
        <p className="text-sm">Select an article to view details and AI summary.</p>
      </div>
    );
  }

  const dateFormated = entry.publishedAt
    ? format(new Date(entry.publishedAt), "MMMM d, yyyy • h:mm a")
    : "Unknown date";

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-slate-900/30 relative">
      <div className="max-w-3xl mx-auto p-10 pb-32">
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white leading-tight mb-4">
              {entry.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="text-indigo-300 font-medium">{entry.author || "Unknown Author"}</span>
              <span>•</span>
              <span>{dateFormated}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/10">
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              Read Original <ExternalLink size={16} />
            </a>

            <div className="h-6 w-px bg-white/10 mx-2" />

            <button
              onClick={() => onAction(entry.id, "bookmark")} // Toggle needed in future, keeping simple for now
              disabled={isActionPending}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
              title="Bookmark"
            >
              <Bookmark size={18} />
            </button>
            <button
              onClick={() => onAction(entry.id, "read")} // Toggle needed
              disabled={isActionPending}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
              title="Mark as Read"
            >
              <CheckCircle2 size={18} />
            </button>
          </div>

          {/* AI Summary Section */}
          <div className="relative">
            {!entry.summary && !isSummarizePending && (
              <div className="rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-lg font-medium text-indigo-200 mb-2">Enhance your reading</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                  Use Generative AI to instantly extract key insights, bullet points, and the main takeaway from this lengthy article.
                </p>
                <button
                  onClick={() => onSummarize(entry.id)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles size={18} />
                  Generate AI Summary
                </button>
              </div>
            )}

            {isSummarizePending && <SummarySkeleton />}

            {entry.summary && !isSummarizePending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl glass border border-purple-500/20 p-8 shadow-2xl shadow-purple-500/5"
              >
                <div className="absolute top-0 left-8 -translate-y-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg">
                  <Sparkles size={14} /> AI Insight
                </div>

                <div className="prose prose-invert prose-indigo max-w-none mt-4 prose-p:leading-relaxed prose-p:text-slate-300 prose-headings:text-slate-100 prose-strong:text-indigo-300 prose-li:text-slate-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {entry.summary}
                  </ReactMarkdown>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => onSummarize(entry.id)}
                    className="text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                  >
                    <Loader2 size={12} className={isSummarizePending ? "animate-spin" : ""} />
                    Regenerate
                  </button>
                </div>
              </motion.div>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
