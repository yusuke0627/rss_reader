export interface Subscription {
  id: string;
  userId: string;
  feedId: string;
  folderId: string | null;
  createdAt: Date;
}
