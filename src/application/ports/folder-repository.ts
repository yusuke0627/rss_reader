import type { Folder } from "@/domain/entities";

export interface FolderRepository {
  listByUserId(userId: string): Promise<Folder[]>;
  findByIdForUser(input: { userId: string; folderId: string }): Promise<Folder | null>;
  create(input: { userId: string; name: string }): Promise<Folder>;
  delete(input: { userId: string; folderId: string }): Promise<void>;
}
