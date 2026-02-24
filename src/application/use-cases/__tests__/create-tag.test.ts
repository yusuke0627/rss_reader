import { TagRepository } from "@/application/ports";
import { describe, expect, it, vi } from "vitest";
import { CreateTag } from "../create-tag";

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

describe("CreateTag useCase", () => {
  it("正常系: タグが正常に作成される", async () => {
    // Arrange
    const deps = createMockDeps();
    // タグ未登録
    vi.mocked(deps.tagRepository.listByUserId).mockResolvedValue([]);
    vi.mocked(deps.tagRepository.create).mockResolvedValue(fakeTag);

    const useCase = new CreateTag(deps);

    // Act
    const result = await useCase.execute({
      userId: fakeTag.userId,
      name: fakeTag.name,
    });

    // Assert
    expect(result).toEqual(fakeTag);
    expect(deps.tagRepository.create).toHaveBeenCalledTimes(1);
    expect(deps.tagRepository.create).toHaveBeenCalledWith({
      userId: "user-1",
      name: "News",
    });
  });
  it("異常系: 同じ名前のタグがすでに存在するならば既存データを返す", async () => {
    const deps = createMockDeps();
    vi.mocked(deps.tagRepository.listByUserId).mockResolvedValue([fakeTag]);
    const useCase = new CreateTag(deps);
    await expect(
      useCase.execute({
        userId: fakeTag["userId"],
        name: fakeTag["name"],
      }),
    ).resolves.toEqual(fakeTag);
  });
});
