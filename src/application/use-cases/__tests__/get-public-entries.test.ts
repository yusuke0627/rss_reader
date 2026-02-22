import { describe, it, expect, vi } from "vitest";
import { GetPublicEntries, NotFoundError } from "../get-public-entries";
import type { EntryRepository, UserRepository } from "@/application/ports";
import type { Entry, PublicProfile } from "@/domain/entities";

function createMockDeps() {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    findPublicProfileBySlug: vi.fn(),
    upsertPublicProfile: vi.fn(),
  };

  const entryRepository: EntryRepository = {
    listByFilter: vi.fn(),
    findByIdForUser: vi.fn(),
    saveFetchedEntries: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    toggleBookmark: vi.fn(),
    listPublicEntriesBySlug: vi.fn(),
  };

  return { userRepository, entryRepository };
}

const fakeProfile: PublicProfile = {
  userId: "user-1",
  publicSlug: "test-user",
  isPublic: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-02-01"),
};

const fakeEntries: Entry[] = [
  {
    id: "entry-1",
    feedId: "feed-1",
    guid: "guid-1",
    title: "公開記事1",
    url: "https://example.com/1",
    content: "内容1",
    author: "著者1",
    createdAt: new Date("2026-01-01"),
    publishedAt: new Date("2026-01-01"),
  },
];

describe("GetPublicEntries UseCase", () => {
  it("正常系: 公開プロフィールが存在し、isPublicがtrueなら記事一覧を返す", async () => {
    // ── Arrange（準備）──
    const deps = createMockDeps();
    // 1. userRepository.findPublicProfileBySlug が fakeProfile を返すように設定
    (
      deps.userRepository.findPublicProfileBySlug as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeProfile);

    // 2. entryRepository.listPublicEntriesBySlug が fakeEntries を返すように設定
    (
      deps.entryRepository.listPublicEntriesBySlug as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeEntries);

    // use caseの用意
    const useCase = new GetPublicEntries(deps);

    // ── Act（実行）──
    const result = await useCase.execute({ slug: "test-user" });

    // ── Assert（検証）──
    // result が fakeEntries と一致するか？
    expect(result).toEqual(fakeEntries);

    // userRepository.findPublicProfileBySlug が正しい引数で呼ばれたか？
    expect(deps.userRepository.findPublicProfileBySlug).toHaveBeenCalledTimes(
      1,
    );
  });

  it("異常系: プロフィールが見つからない場合は NotFoundError が投げられる", async () => {
    // findPublicProfileBySlug が null を返すように設定
    const deps = createMockDeps();

    (
      deps.userRepository.findPublicProfileBySlug as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const useCase = new GetPublicEntries(deps);

    // UseCaseの引数
    // export interface GetPublicEntriesInput {
    //   slug: string;
    //   limit?: number;
    //   cursor?: string;
    // }
    // if (!profile || profile.isPublic === false)
    await expect(
      useCase.execute({ slug: "test-slug", limit: 10, cursor: "1" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("異常系: プロフィールはあるが isPublic が false の場合は NotFoundError が投げられる", async () => {
    const deps = createMockDeps();
    (
      deps.userRepository.findPublicProfileBySlug as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ...fakeProfile, isPublic: false });

    const useCase = new GetPublicEntries(deps);

    await expect(useCase.execute({ slug: "test-slug" })).rejects.toThrow(
      NotFoundError,
    );
  });
});
