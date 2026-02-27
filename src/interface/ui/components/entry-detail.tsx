"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Sparkles, Loader2, ExternalLink, Bookmark, CheckCircle2, FileText } from "lucide-react";
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
  <div className="mt-8 rounded-3xl bg-m3-surface-container p-6 w-full animate-pulse border border-m3-outline-variant/50">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 rounded-full bg-m3-primary-container/50" />
      <div className="h-4 w-32 bg-m3-surface-container-highest rounded-full" />
    </div>
    <div className="space-y-4">
      <div className="h-3 bg-m3-surface-container-highest rounded-full w-full" />
      <div className="h-3 bg-m3-surface-container-highest rounded-full w-[90%]" />
      <div className="h-3 bg-m3-surface-container-highest rounded-full w-[95%]" />
      <div className="h-3 bg-m3-surface-container-highest rounded-full w-[80%]" />
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
      <div className="flex-1 flex flex-col items-center justify-center text-m3-on-surface-variant bg-m3-surface h-full">
        <div className="w-20 h-20 mb-6 rounded-full bg-m3-surface-container-high flex items-center justify-center">
          <FileText className="text-m3-primary" size={32} />
        </div>
        <p className="text-base font-medium">Select an article to read</p>
      </div>
    );
  }

  const dateFormated = entry.publishedAt
    ? format(new Date(entry.publishedAt), "MMMM d, yyyy • h:mm a")
    : "Unknown date";

  // Sanitize existing CDATA or leftover entities from older DB entries BEFORE rendering.
  const cleanContent = (str: string | undefined | null) => {
    if (!str) return "";
    let decoded = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
    // Decode numeric references
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    return decoded;
  };

  const safeContent = cleanContent(entry.content);

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-m3-surface relative">
      <div className="max-w-3xl mx-auto p-8 sm:p-12 pb-32">
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-normal text-m3-on-surface leading-[1.15] mb-6 tracking-tight">
              {entry.title}
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium text-m3-on-surface-variant">
              <span className="text-m3-primary">{entry.author || "Unknown Author"}</span>
              <span>•</span>
              <span>{dateFormated}</span>
            </div>
          </div>

          {/* Content / Description */}
          {safeContent && (
            <div className="mb-12 prose prose-invert prose-p:text-m3-on-surface prose-headings:text-m3-on-surface prose-a:text-m3-primary hover:prose-a:text-m3-primary/80 prose-strong:text-m3-on-surface prose-li:text-m3-on-surface max-w-none prose-lg leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {safeContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Action Bar (Material Tonal/Text Buttons) */}
          <div className="flex flex-wrap items-center gap-4 mb-12 py-4 border-y border-m3-outline-variant/50">
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-m3-primary text-m3-on-primary text-sm font-medium m3-state-layer shadow-sm"
            >
              Read full article <ExternalLink size={18} />
            </a>

            <div className="flex-1" />

            <button
              onClick={() => onAction(entry.id, "bookmark")}
              disabled={isActionPending}
              className="px-4 py-2.5 rounded-full m3-state-layer flex items-center gap-2 text-m3-on-surface-variant hover:text-m3-on-surface text-sm font-medium"
            >
              <Bookmark size={20} /> Bookmark
            </button>
            <button
              onClick={() => onAction(entry.id, "read")}
              disabled={isActionPending}
              className="px-4 py-2.5 rounded-full m3-state-layer flex items-center gap-2 bg-m3-secondary-container text-m3-on-secondary-container text-sm font-medium shadow-sm"
            >
              <CheckCircle2 size={20} className="text-m3-primary" /> Mark as read
            </button>
          </div>

          {/* AI Summary Section */}
          <div className="relative mt-12">
            {!entry.summary && !isSummarizePending && (
              <div className="rounded-3xl border border-m3-outline-variant bg-m3-surface-container-low p-8 sm:p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center mb-6">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-normal text-m3-on-surface mb-3 tracking-tight">AI Summary</h3>
                <p className="text-m3-on-surface-variant text-base mb-8 max-w-md">
                  Extract the key points and core message in seconds using generative AI.
                </p>
                <button
                  onClick={() => onSummarize(entry.id)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-m3-tertiary text-m3-on-tertiary text-base font-medium m3-state-layer shadow-sm"
                >
                  <Sparkles size={20} />
                  Generate Insight
                </button>
              </div>
            )}

            {isSummarizePending && <SummarySkeleton />}

            {entry.summary && !isSummarizePending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl bg-m3-tertiary-container p-8 sm:p-12 shadow-sm border border-m3-outline-variant/20"
              >
                <div className="flex items-center gap-3 text-m3-on-tertiary-container mb-6">
                  <Sparkles size={24} />
                  <span className="text-sm font-bold tracking-widest uppercase">AI Insight</span>
                </div>

                <div className="prose prose-invert prose-p:text-m3-on-tertiary-container prose-headings:text-m3-on-tertiary-container prose-strong:text-m3-on-tertiary-container prose-li:text-m3-on-tertiary-container max-w-none text-lg leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {entry.summary}
                  </ReactMarkdown>
                </div>

                <div className="mt-10 pt-6 border-t border-m3-outline-variant/30 flex justify-end">
                  <button
                    onClick={() => onSummarize(entry.id)}
                    className="text-sm font-medium text-m3-on-tertiary-container opacity-80 hover:opacity-100 flex items-center gap-2 m3-state-layer px-4 py-2 rounded-full"
                  >
                    <Loader2 size={16} className={isSummarizePending ? "animate-spin" : ""} />
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
