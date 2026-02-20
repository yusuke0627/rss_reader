import type {
  FetchFeedInput,
  FetchedFeed,
  RssFetcher,
} from "@/application/ports";

function pickFirstTagValue(source: string, tagNames: string[]): string | null {
  for (const tagName of tagNames) {
    // If the tag name contains '>', we only look for the leaf tag for simplicity,
    // but try to find it within the parent context if possible.
    // For now, let's just match the leaf tag but ensure it's not preceded by something that breaks it.
    const leafTag = tagName.includes(">") ? tagName.split(">").pop()! : tagName;

    // We use a regex that matches <tag>content</tag> or <tag />.
    const re = new RegExp(`<${leafTag}[^>]*>([\\s\\S]*?)<\\/${leafTag}>`, "i");
    const m = source.match(re);
    if (m?.[1]) {
      return decodeXml(m[1].trim());
    }
  }
  return null;
}

function extractLink(block: string): string | null {
  const atomLink = block.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i,
  );
  if (atomLink?.[1]) {
    return decodeXml(atomLink[1]);
  }

  const rssLink = pickFirstTagValue(block, ["link"]);
  return rssLink;
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export class RssFetcherHttp implements RssFetcher {
  async fetchFeed(input: FetchFeedInput): Promise<FetchedFeed> {
    const headers = new Headers();
    // 一部サイトは Accept/User-Agent に厳しいため、明示的に付与する。
    headers.set(
      "Accept",
      "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
    );
    headers.set(
      "User-Agent",
      "rss-reader/0.1 (+https://github.com/yusuke0627/rss_reader)",
    );
    headers.set("Accept-Language", "ja,en-US;q=0.8,en;q=0.6");
    if (input.etag) {
      headers.set("If-None-Match", input.etag);
    }
    if (input.lastModified) {
      headers.set("If-Modified-Since", input.lastModified);
    }

    const response = await fetch(input.url, {
      method: "GET",
      headers,
      redirect: "follow",
      // 永続ハングを避けるため明示タイムアウト。
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 304) {
      // 差分なし。entry配列は空で返す。
      return {
        title: input.url,
        siteUrl: null,
        etag: response.headers.get("etag"),
        lastModified: response.headers.get("last-modified"),
        entries: [],
        notModified: true,
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }

    const body = await response.text();

    const titleMatch = pickFirstTagValue(body, [
      "channel>title",
      "feed>title",
      "title",
    ]);
    const title = titleMatch ?? input.url;
    const siteUrl = extractLink(body);

    const itemBlocks = [
      ...body.matchAll(/<item[\s\S]*?<\/item>/gi),
      ...body.matchAll(/<entry[\s\S]*?<\/entry>/gi),
    ].map((m) => m[0]);

    // RSS(item) と Atom(entry) を同じ構造へ正規化。
    const entries = itemBlocks.slice(0, 200).map((block, idx) => {
      const link = extractLink(block) ?? `${input.url}#${idx}`;
      const guid = pickFirstTagValue(block, ["guid", "id"]) ?? link;
      return {
        guid,
        title: pickFirstTagValue(block, ["title"]) ?? link,
        url: link,
        content: pickFirstTagValue(block, [
          "content:encoded",
          "content",
          "description",
          "summary",
        ]),
        publishedAt: parseDate(
          pickFirstTagValue(block, [
            "pubDate",
            "published",
            "updated",
            "dc:date",
          ]),
        ),
        author: pickFirstTagValue(block, ["author", "dc:creator"]),
      };
    });

    return {
      title,
      siteUrl,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      entries,
      notModified: false,
    };
  }
}
