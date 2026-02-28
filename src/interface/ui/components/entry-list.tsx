"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2, FileText, CheckCircle2, RefreshCw } from "lucide-react";

export interface EntryItemType {
  id: string;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string | null;
  content?: string | null;
  summary?: string | null;
  imageUrl?: string | null;
}

interface EntryListProps {
  entries: EntryItemType[];
  isLoading: boolean;
  activeEntryId: string | null;
  onSelectEntry: (entry: EntryItemType) => void;
  search: string;
  onSearchChange: (value: string) => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (value: boolean) => void;
  onRefresh: () => void;
}

export function EntryList({
  entries,
  isLoading,
  activeEntryId,
  onSelectEntry,
  search,
  onSearchChange,
  unreadOnly,
  onUnreadOnlyChange,
  onRefresh,
}: EntryListProps) {
  // Sanitize leftover entities from older DB entries before rendering
  const cleanContent = (str: string | undefined | null) => {
    if (!str) return "";
    let decoded = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    decoded = decoded.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    return decoded;
  };

  return (
    <div className="flex flex-col h-full bg-m3-surface border-r border-m3-outline-variant">
      {/* Search Header */}
      <div className="p-4 bg-m3-surface-container sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium tracking-tight text-m3-on-surface">Inbox</h2>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-sm font-medium px-4 py-2 rounded-full m3-state-layer text-m3-primary hover:bg-m3-primary/10 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-m3-surface-container-high rounded-full pl-12 pr-4 py-3 text-sm text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary transition-all placeholder:text-m3-on-surface-variant"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-m3-on-surface-variant font-medium cursor-pointer w-max m3-state-layer px-2 py-1 rounded-md">
          <div className={`relative flex items-center justify-center w-5 h-5 rounded-sm border-2 transition-colors ${unreadOnly ? "bg-m3-primary border-m3-primary" : "border-m3-outline"}`}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => onUnreadOnlyChange(e.target.checked)}
              className="peer sr-only"
            />
            {unreadOnly && <CheckCircle2 size={16} strokeWidth={3} className="text-m3-on-primary absolute" />}
          </div>
          Unread only
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar bg-m3-surface">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-m3-on-surface-variant gap-3">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-sm">Loading articles...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-m3-on-surface-variant gap-3">
            <FileText size={40} className="opacity-50" />
            <span className="text-sm font-medium">No articles found.</span>
          </div>
        ) : (
          entries.map((entry, index) => {
            const isActive = activeEntryId === entry.id;
            const dateStr = entry.publishedAt
              ? formatDistanceToNow(new Date(entry.publishedAt), { addSuffix: true })
              : "";

            const safeTitle = cleanContent(entry.title);
            const safeAuthor = cleanContent(entry.author);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`p-4 rounded-2xl cursor-pointer transition-colors m3-state-layer ${isActive
                  ? "bg-m3-secondary-container text-m3-on-secondary-container"
                  : "hover:bg-m3-surface-container-high text-m3-on-surface"
                  }`}
              >
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-medium mb-1 line-clamp-2 leading-snug`}>
                      {safeTitle}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs line-clamp-1 ${isActive ? "text-m3-on-secondary-container/80" : "text-m3-on-surface-variant"}`}>
                        {safeAuthor || "Unknown"} • {dateStr}
                      </span>
                      {entry.summary && (
                        <span className="text-[10px] font-bold bg-m3-primary text-m3-on-primary px-1.5 py-0.5 rounded-md leading-none shadow-sm ml-2">
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={entry.imageUrl}
                        alt=""
                        className="w-20 h-20 object-cover rounded-xl bg-m3-surface-container-highest shadow-sm"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
