import { TagRepository } from "@/application/ports";
import { describe, expect, it, vi } from "vitest";
import { DeleteTag } from "../delete-tag";

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

describe("DeleteTag uesCase", () => {
  it("正常系: タグを削除する", async () => {
    // Arrange
    const deps = createMockDeps();
    //タグが存在する
    vi.mocked(deps.tagRepository.findByIdForUser).mockResolvedValue(fakeTag);

    // Act
    const useCase = new DeleteTag(deps);
    await useCase.execute({
      userId: fakeTag.userId,
      tagId: fakeTag.id,
    });

    // Asert
    expect(deps.tagRepository.delete).toHaveBeenCalledTimes(1);
    expect(deps.tagRepository.delete).toHaveBeenCalledWith({
      userId: fakeTag.userId,
      tagId: fakeTag.id,
    });
  });

  it("異常系: タグが見つからなければエラーを投げる", async () => {
    // Arrange
    const deps = createMockDeps();
    // Null = タグが存在しない
    vi.mocked(deps.tagRepository.findByIdForUser).mockResolvedValue(null);

    // Act
    const useCase = new DeleteTag(deps);
    await expect(
      useCase.execute({
        userId: fakeTag.userId,
        tagId: fakeTag.id,
      }),
    ).rejects.toThrow("Tag not found");
  });
});
