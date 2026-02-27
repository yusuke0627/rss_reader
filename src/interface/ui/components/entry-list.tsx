"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2, FileText, CheckCircle2, Bookmark } from "lucide-react";

export interface EntryItemType {
  id: string;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string | null;
  summary?: string | null;
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
  return (
    <div className="flex flex-col h-full bg-slate-900/50 border-r border-white/5">
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Articles</h2>
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer w-max group">
          <div className="relative flex items-center justify-center w-5 h-5 border border-white/20 rounded-md bg-black/20 group-hover:border-indigo-500/50 transition-colors">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => onUnreadOnlyChange(e.target.checked)}
              className="peer sr-only"
            />
            {unreadOnly && <CheckCircle2 size={14} className="text-indigo-400 absolute" />}
          </div>
          Unread only
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Loading articles...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
            <FileText size={32} className="opacity-50" />
            <span className="text-sm">No articles found.</span>
          </div>
        ) : (
          entries.map((entry, index) => {
            const isActive = activeEntryId === entry.id;
            const dateStr = entry.publishedAt
              ? formatDistanceToNow(new Date(entry.publishedAt), { addSuffix: true })
              : "";

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${isActive
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                  }`}
              >
                <h3 className={`text-sm font-semibold mb-2 line-clamp-2 leading-relaxed ${isActive ? "text-indigo-300" : "text-slate-200"}`}>
                  {entry.title}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500 line-clamp-1">
                    {entry.author || "Unknown"} • {dateStr}
                  </span>
                  {entry.summary && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" title="AI Summary Available" />
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
