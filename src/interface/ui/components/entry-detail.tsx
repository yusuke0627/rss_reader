"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CheckCircle2 } from "lucide-react";
import { Sparkles, Loader2, ExternalLink, Bookmark, FileText, Tag as TagIcon, X } from "lucide-react";
import type { EntryItemType } from "./entry-list";
import type { Tag } from "./home-client";
import { format } from "date-fns";
import { useState } from "react";

interface EntryDetailProps {
  entry: EntryItemType | null;
  onSummarize: (id: string) => void;
  isSummarizePending: boolean;
  onAction: (id: string, action: "read" | "unread" | "bookmark" | "unbookmark") => void;
  isActionPending: boolean;
  availableTags: Tag[];
  onAddTag: (entryId: string, tagId: string) => void;
  onRemoveTag: (entryId: string, tagId: string) => void;
  isTagActionPending: boolean;
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
  availableTags,
  onAddTag,
  onRemoveTag,
  isTagActionPending,
}: EntryDetailProps) {
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
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

  const cleanContent = (str: string | undefined | null) => {
    if (!str) return "";
    let decoded = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
    // Decode numeric references
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    decoded = decoded.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    return decoded;
  };

  const safeContent = cleanContent(entry.content);
  const safeUrl = cleanContent(entry.url);
  const safeTitle = cleanContent(entry.title);
  const safeAuthor = cleanContent(entry.author) || "Unknown Author";

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
              {safeTitle}
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium text-m3-on-surface-variant flex-wrap">
              <span className="text-m3-primary">{safeAuthor}</span>
              <span>•</span>
              <span>{dateFormated}</span>

              {/* Tag Display & Assignment */}
              {entry.tags && entry.tags.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.tags.map(tag => (
                      <div key={tag.id} className="flex items-center bg-m3-secondary-container/60 text-m3-on-secondary-container px-2.5 py-1 rounded-full text-xs font-semibold group relative border border-m3-outline-variant/30 hover:bg-m3-secondary-container transition-colors shadow-sm">
                        <span>{tag.name}</span>
                        <button
                          onClick={() => onRemoveTag(entry.id, tag.id)}
                          className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-m3-on-secondary-container/20 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center bg-m3-secondary-container/50"
                          disabled={isTagActionPending}
                          title="Remove Tag"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="relative inline-block">
                <button
                  onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold m3-state-layer transition-all shadow-sm ${isTagMenuOpen
                    ? "bg-m3-primary text-m3-on-primary"
                    : "bg-m3-tertiary-container text-m3-on-tertiary-container hover:bg-m3-tertiary-container/80 hover:shadow-md active:scale-95"
                    }`}
                  disabled={isTagActionPending}
                >
                  {isTagActionPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <TagIcon size={16} />
                      <span>{entry.tags && entry.tags.length > 0 ? "Edit Tags" : "Add Tags"}</span>
                    </>
                  )}
                </button>

                {isTagMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-m3-surface-container-high border border-m3-outline-variant/30 rounded-xl shadow-lg z-20 py-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {availableTags.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-m3-on-surface-variant italic">No tags created yet.</div>
                    ) : (
                      availableTags.map(tag => {
                        const isAssigned = entry.tags?.some(t => t.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              if (isAssigned) {
                                onRemoveTag(entry.id, tag.id);
                              } else {
                                onAddTag(entry.id, tag.id);
                              }
                              setIsTagMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${isAssigned
                              ? "bg-m3-primary/10 text-m3-primary font-medium"
                              : "text-m3-on-surface hover:bg-m3-surface-container-highest"
                              }`}
                          >
                            <span>{tag.name}</span>
                            {isAssigned && <CheckCircle2 size={14} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero Image */}
          {entry.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10 group overflow-hidden rounded-[32px] bg-m3-surface-container-highest shadow-md"
            >
              <img
                src={entry.imageUrl}
                alt=""
                className="w-full h-auto aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </motion.div>
          )}

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
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-m3-primary text-m3-on-primary text-sm font-medium m3-state-layer shadow-sm"
            >
              Read full article <ExternalLink size={18} />
            </a>

            <div className="flex-1" />

            <button
              onClick={() => onAction(entry.id, entry.isBookmarked ? "unbookmark" : "bookmark")}
              disabled={isActionPending}
              className={`px-4 py-2.5 rounded-full m3-state-layer flex items-center gap-2 text-sm font-medium transition-colors ${entry.isBookmarked
                ? "bg-m3-surface-container-highest text-m3-on-surface"
                : "text-m3-on-surface-variant hover:bg-m3-surface-container-highest hover:text-m3-on-surface"
                }`}
            >
              <Bookmark size={20} className={entry.isBookmarked ? "fill-current" : ""} />
              {entry.isBookmarked ? "Unbookmark" : "Bookmark"}
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
