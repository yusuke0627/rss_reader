export interface UserEntry {
  userId: string;
  entryId: string;
  isRead: boolean;
  isBookmarked: boolean;
  readAt: Date | null;
}
