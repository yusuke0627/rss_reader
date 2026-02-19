import type { FolderRepository } from "@/application/ports";
import type { Folder } from "@/domain/entities";
import { createId, inMemoryStore } from "./in-memory-store";

export class InMemoryFolderRepository implements FolderRepository {
  async listByUserId(userId: string): Promise<Folder[]> {
    return inMemoryStore.folders.filter((folder) => folder.userId === userId);
  }

  async findByIdForUser(input: { userId: string; folderId: string }): Promise<Folder | null> {
    return (
      inMemoryStore.folders.find(
        (folder) => folder.userId === input.userId && folder.id === input.folderId,
      ) ?? null
    );
  }

  async create(input: { userId: string; name: string }): Promise<Folder> {
    const folder: Folder = {
      id: createId(),
      userId: input.userId,
      name: input.name,
    };
    inMemoryStore.folders.push(folder);
    return folder;
  }

  async delete(input: { userId: string; folderId: string }): Promise<void> {
    inMemoryStore.folders = inMemoryStore.folders.filter(
      (folder) => !(folder.userId === input.userId && folder.id === input.folderId),
    );

    for (const subscription of inMemoryStore.subscriptions) {
      if (subscription.userId === input.userId && subscription.folderId === input.folderId) {
        subscription.folderId = null;
      }
    }
  }
}
