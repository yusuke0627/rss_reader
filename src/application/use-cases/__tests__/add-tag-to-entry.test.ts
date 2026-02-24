import { TagRepository } from "@/application/ports";
import { describe, expect, it, vi } from "vitest";
import { AddTagToEntry } from "../add-tag-to-entry";

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

describe("AddTagToEntry useCase", () => {
  it("正常系: 自分のタグを記事に紐づける", async () => {
    // Arrange: deps を作り、findByIdForUser が tag を返すように設定
    const deps = createMockDeps();
    vi.mocked(deps.tagRepository.findByIdForUser).mockResolvedValue(fakeTag);

    // Act: execute を呼ぶ
    const useCase = new AddTagToEntry(deps);
    await useCase.execute({
      userId: fakeTag.userId, //自分のタグ
      tagId: fakeTag.id,
      entryId: "entry-1",
    });

    // Assert: addToEntry が呼ばれたか確認
    expect(deps.tagRepository.addToEntry).toHaveBeenCalledTimes(1);
    // 自分のタグのみ
    expect(deps.tagRepository.addToEntry).toHaveBeenCalledWith({
      entryId: "entry-1",
      tagId: "tag-1",
    });
  });

  it("異常系: タグが見つからない場合はエラーを投げる", async () => {
    // Arrage
    const deps = createMockDeps();
    // NULL = 新規作成
    vi.mocked(deps.tagRepository.findByIdForUser).mockRejectedValue(null);

    // Act: execute
    const useCase = new AddTagToEntry(deps);
    await expect(
      useCase.execute({
        userId: fakeTag.userId,
        tagId: fakeTag.id,
        entryId: "entry-1",
      }),
    ).rejects.toThrow("Tag not found");
  });
});
