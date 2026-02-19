export interface ParsedOpmlSubscription {
  title?: string;
  xmlUrl: string;
  htmlUrl?: string;
  folderName?: string;
}

export interface OpmlService {
  parse(input: string): Promise<ParsedOpmlSubscription[]>;
  build(input: Array<{ title: string; xmlUrl: string; htmlUrl?: string }>): Promise<string>;
}
