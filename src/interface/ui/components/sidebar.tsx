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
    <aside className="w-80 flex flex-col h-full bg-m3-surface-container border-r border-m3-outline-variant transition-colors text-m3-on-surface">
      <div className="p-6">
        {/* Navigation Drawer Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-m3-primary-container text-m3-on-primary-container shadow-sm">
            <Rss size={20} />
          </div>
          <h1 className="text-xl font-medium tracking-tight">Lumina RSS</h1>
        </div>

        {/* Floating Action Button (FAB) Style for Add */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 p-4 rounded-3xl bg-m3-surface-container-high border border-m3-outline-variant/30">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-m3-primary mb-1 pl-1">
              Add New Feed
            </h3>
            <input
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-m3-surface-container-highest border-b-2 border-m3-outline-variant focus:border-m3-primary rounded-t-sm px-3 py-2 text-sm focus:outline-none transition-colors placeholder:text-m3-on-surface-variant text-m3-on-surface"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onAddFeed(draftUrl)}
                disabled={!draftUrl.trim() || isAdding}
                className="flex-1 m3-state-layer rounded-full bg-m3-primary text-m3-on-primary text-sm font-medium py-2.5 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:bg-m3-surface-variant disabled:text-m3-on-surface-variant"
              >
                {isAdding ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add</>}
              </button>
              <button
                onClick={onClear}
                className="p-2.5 rounded-full m3-state-layer hover:bg-m3-error-container text-m3-on-surface-variant hover:text-m3-on-error-container transition-colors"
                title="Clear"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Rail / Drawer Items */}
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-full bg-m3-secondary-container text-m3-on-secondary-container font-medium m3-state-layer">
            <Library size={20} />
            All Feeds
          </button>
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-m3-surface-container-highest text-m3-on-surface-variant font-medium m3-state-layer">
            <Plus size={20} />
            Discover
          </button>
        </nav>

        {/* Divider */}
        <div className="h-px bg-m3-outline-variant my-6 mx-2" />

        {/* Categories section */}
        <div className="mb-6">
          <h2 className="px-4 text-sm font-medium text-m3-on-surface-variant mb-3">
            Categories
          </h2>
          <div className="space-y-1">
            {[
              { name: "Technology", count: 24 },
              { name: "Design", count: 8 },
              { name: "Business", count: 15 },
              { name: "Science", count: 42 }
            ].map((cat) => (
              <button key={cat.name} className="w-full flex items-center justify-between px-4 py-3 rounded-full hover:bg-m3-surface-container-highest transition-colors group m3-state-layer">
                <div className="flex items-center gap-4 text-m3-on-surface-variant group-hover:text-m3-on-surface">
                  <Folder size={20} />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <span className="text-xs font-medium text-m3-on-surface-variant">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
