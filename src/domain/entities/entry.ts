export interface Entry {
  id: string;
  feedId: string;
  guid: string;
  title: string;
  url: string;
  content: string | null;
  publishedAt: Date | null;
  author: string | null;
  createdAt: Date;
}
