import type {
  OpmlService,
  ParsedOpmlSubscription,
} from "@/application/ports/opml-service";
import { XMLParser } from "fast-xml-parser";

export class OpmlServiceImpl implements OpmlService {
  async parse(input: string): Promise<ParsedOpmlSubscription[]> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const jsonObj = parser.parse(input);
    const subscriptions: ParsedOpmlSubscription[] = [];

    // Traverse the parsed JSON structure to find outlines
    const traverse = (node: unknown, currentFolder?: string) => {
      if (!node || typeof node !== "object") return;

      // Handle array of nodes
      if (Array.isArray(node)) {
        node.forEach((n) => traverse(n, currentFolder));
        return;
      }

      const nodeObj = node as Record<string, unknown>;

      // If it's an outline element (the tag itself)
      if (nodeObj.outline) {
        traverse(nodeObj.outline, currentFolder);
      }

      // If the node itself is an outline object with attributes
      const type = nodeObj["@_type"] as string | undefined;
      const xmlUrl = nodeObj["@_xmlUrl"] as string | undefined;
      const title = (nodeObj["@_title"] || nodeObj["@_text"]) as
        | string
        | undefined;

      if (xmlUrl && type === "rss") {
        subscriptions.push({
          title,
          xmlUrl,
          htmlUrl: nodeObj["@_htmlUrl"] as string | undefined,
          folderName: currentFolder,
        });
      } else if (!xmlUrl && title) {
        // It's likely a folder outline containing other outlines
        const folderName = title;
        // Recursively check its children (if there's an inner 'outline' property)
        if (nodeObj.outline) {
          traverse(nodeObj.outline, folderName);
        }
      }
    };

    if (jsonObj?.opml?.body) {
      traverse(jsonObj.opml.body);
    }

    return subscriptions;
  }

  async build(
    input: Array<{ title: string; xmlUrl: string; htmlUrl?: string }>,
  ): Promise<string> {
    const date = new Date().toUTCString();

    const outlines = input
      .map((item) => {
        const titleAttr = item.title
          ? `text="${escapeXml(item.title)}" title="${escapeXml(item.title)}"`
          : `text="${escapeXml(item.xmlUrl)}"`;
        const htmlUrlAttr = item.htmlUrl
          ? ` htmlUrl="${escapeXml(item.htmlUrl)}"`
          : "";
        return `    <outline ${titleAttr} type="rss" xmlUrl="${escapeXml(item.xmlUrl)}"${htmlUrlAttr}/>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>RSS Reader Export</title>
    <dateCreated>${date}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>
`;
  }
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
