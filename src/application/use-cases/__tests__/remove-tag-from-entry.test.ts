import { TagRepository } from "@/application/ports";
import { describe, expect, it, vi } from "vitest";
import { RemoveTagFromEntry } from "../remove-tag-from-entry";

function createMockDeps() {
  const tagRepository: TagRepository = {
    listByUserId: vi.fn(),
    findByIdForUser: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    addToEntry: vi.fn(),
    removeFromEntry: vi.fn(),
    listByEntryId: vi.fn(),
  };

  return { tagRepository };
}

const fakeTag = {
  id: "tag-1",
  userId: "user-1",
  name: "News",
};

describe("RemoveTagFromEntry useCase", () => {
  it("正常系: タグを記事から削除する", async () => {
    // Arrange
    const deps = createMockDeps();
    // タグが存在する
    vi.mocked(deps.tagRepository.findByIdForUser).mockResolvedValue(fakeTag);

    // Act
    const useCase = new RemoveTagFromEntry(deps);
    await useCase.execute({
      userId: fakeTag.userId,
      tagId: fakeTag.id,
      entryId: "entry-1",
    });

    // Assert
    expect(deps.tagRepository.removeFromEntry).toHaveBeenCalledTimes(1);
    expect(deps.tagRepository.removeFromEntry).toHaveBeenCalledWith({
      entryId: "entry-1",
      tagId: "tag-1",
    });
  });

  it("異常系: タグが見つからない場合はエラーを投げる", async () => {
    // Arrange
    const deps = createMockDeps();
    // NULL = タグが存在しない
    vi.mocked(deps.tagRepository.findByIdForUser).mockResolvedValue(null);

    // Act
    const useCase = new RemoveTagFromEntry(deps);
    await expect(
      useCase.execute({
        userId: fakeTag.userId,
        tagId: fakeTag.id,
        entryId: "entry-1",
      }),
    ).rejects.toThrow("Tag not found");
  });
});
