"use client";

import { useFeedFormStore } from "@/interface/ui/stores/feed-form-store";
import { Plus, Trash2, Library, Folder, Rss, Loader2 } from "lucide-react";

interface SidebarProps {
  onAddFeed: (url: string) => void;
  isAdding: boolean;
  onClear: () => void;
}

export function Sidebar({ onAddFeed, isAdding, onClear }: SidebarProps) {
  const { draftUrl, setDraftUrl } = useFeedFormStore();

  return (
    <aside className="w-72 flex flex-col h-full glass-dark border-r border-white/5 text-slate-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-1.5 shadow-lg shadow-indigo-500/20">
            <Rss className="text-white w-full h-full" />
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            LUMINA RSS
          </h1>
        </div>

        <div className="space-y-1 mb-8">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 text-white font-medium transition-colors">
            <Library size={18} className="text-indigo-400" />
            All Feeds
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400">
            <Plus size={18} />
            Discover
          </button>
        </div>

        <div className="mb-6">
          <h2 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Categories
          </h2>
          <div className="space-y-1">
            {[
              { name: "Technology", count: 24 },
              { name: "Design", count: 8 },
              { name: "Business", count: 15 },
              { name: "Science", count: 42 }
            ].map((cat) => (
              <button key={cat.name} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <Folder size={16} className="text-slate-500 group-hover:text-indigo-400" />
                  <span className="text-sm">{cat.name}</span>
                </div>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white">
          <Plus size={16} className="text-indigo-400" />
          Add New Feed
        </h3>
        <div className="space-y-3">
          <input
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="Feed URL..."
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onAddFeed(draftUrl)}
              disabled={!draftUrl.trim() || isAdding}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : "Add"}
            </button>
            <button
              onClick={onClear}
              className="px-3 bg-white/5 hover:bg-white/10 text-slate-400 py-2 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
