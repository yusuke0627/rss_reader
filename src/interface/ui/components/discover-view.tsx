"use client";

import { useMemo } from "react";
import { Plus, Rss, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import discoverData from "../data/discover-feeds.json";

interface DiscoverFeed {
  title: string;
  description: string;
  url: string;
  iconBgColor: string;
}

interface DiscoverCategory {
  category: string;
  feeds: DiscoverFeed[];
}

interface DiscoverViewProps {
  onSubscribe: (url: string) => void;
  subscribingUrl: string | null;
  subscribedUrls: Set<string>;
}

export function DiscoverView({ onSubscribe, subscribingUrl, subscribedUrls }: DiscoverViewProps) {
  const data = discoverData as DiscoverCategory[];

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold tracking-tight text-m3-on-surface mb-2 italic">Discover</h1>
        <p className="text-m3-on-surface-variant text-lg">
          Explore curated RSS feeds and stay updated with the latest news and trends.
        </p>
      </motion.header>

      <div className="space-y-16">
        {data.map((group, groupIdx) => (
          <motion.section
            key={group.category}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: groupIdx * 0.15 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-semibold text-m3-primary">{group.category}</h2>
              <div className="h-px flex-1 bg-m3-outline-variant/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.feeds.map((feed) => (
                <DiscoverCard
                  key={feed.url}
                  feed={feed}
                  onSubscribe={() => onSubscribe(feed.url)}
                  isSubscribing={subscribingUrl === feed.url}
                  isSubscribed={subscribedUrls.has(feed.url)}
                />
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

function DiscoverCard({
  feed,
  onSubscribe,
  isSubscribing,
  isSubscribed
}: {
  feed: DiscoverFeed;
  onSubscribe: () => void;
  isSubscribing: boolean;
  isSubscribed: boolean;
}) {
  const hostname = useMemo(() => {
    try {
      return new URL(feed.url).hostname;
    } catch {
      return "";
    }
  }, [feed.url]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative flex flex-col p-6 rounded-[28px] bg-m3-surface-container-low border border-m3-outline-variant/20 hover:bg-m3-surface-container transition-all duration-300 hover:shadow-xl overflow-hidden"
    >
      {/* Visual Accent */}
      <motion.div
        whileHover={{ scale: 1.5, rotate: 15 }}
        className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 group-hover:opacity-25 transition-all duration-500 transform ${feed.iconBgColor}`}
      />

      <div className="flex items-start gap-4 mb-4 relative z-10">
        <motion.div
          whileHover={{ rotate: 12 }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform duration-300 ${feed.iconBgColor}`}
        >
          <Rss size={24} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <motion.h3 className="text-lg font-bold text-m3-on-surface leading-tight truncate px-1">
            {feed.title}
          </motion.h3>
          <p className="text-xs text-m3-on-surface-variant font-medium opacity-80 mt-0.5 px-1 truncate">
            {hostname}
          </p>
        </div>
      </div>

      <p className="text-sm text-m3-on-surface-variant mb-8 line-clamp-3 min-h-[3rem] px-1 relative z-10 font-medium">
        {feed.description || "No description available."}
      </p>

      <div className="mt-auto flex justify-end relative z-10">
        <button
          onClick={onSubscribe}
          disabled={isSubscribing || isSubscribed}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${isSubscribed
            ? "bg-m3-surface-container-highest text-m3-primary border border-m3-primary/20"
            : isSubscribing
              ? "bg-m3-surface-container-highest text-m3-on-surface-variant cursor-not-allowed"
              : "bg-m3-primary text-m3-on-primary hover:bg-m3-primary/90 hover:shadow-lg active:scale-95 shadow-sm"
            }`}
        >
          {isSubscribed ? (
            <>
              <Check size={18} className="text-m3-primary" />
              Subscribed
            </>
          ) : isSubscribing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus size={18} />
              Subscribe
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
