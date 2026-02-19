import type { FetchFeedInput, FetchedFeed, RssFetcher } from "@/application/ports";

function pickFirstTagValue(source: string, tagNames: string[]): string | null {
  for (const tag of tagNames) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = source.match(re);
    if (m?.[1]) {
      return decodeXml(m[1].trim());
    }
  }
  return null;
}

function extractLink(block: string): string | null {
  const atomLink = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i);
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
    });

    if (response.status === 304) {
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

    const title =
      pickFirstTagValue(body, ["channel>title", "feed>title", "title"]) ?? input.url;
    const siteUrl = extractLink(body);

    const itemBlocks = [
      ...body.matchAll(/<item[\s\S]*?<\/item>/gi),
      ...body.matchAll(/<entry[\s\S]*?<\/entry>/gi),
    ].map((m) => m[0]);

    const entries = itemBlocks.slice(0, 200).map((block, idx) => {
      const link = extractLink(block) ?? `${input.url}#${idx}`;
      const guid = pickFirstTagValue(block, ["guid", "id"]) ?? link;
      return {
        guid,
        title: pickFirstTagValue(block, ["title"]) ?? link,
        url: link,
        content:
          pickFirstTagValue(block, ["content:encoded", "content", "description", "summary"]),
        publishedAt: parseDate(
          pickFirstTagValue(block, ["pubDate", "published", "updated", "dc:date"]),
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
