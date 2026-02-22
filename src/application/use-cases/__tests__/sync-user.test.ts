// ============================================================
// サンプルテスト②: SyncUser UseCase のテスト
// ============================================================
// 【学習ポイント】
//   - モック（偽物）を使った依存関係の差し替え
//   - vi.fn() でモック関数を作る方法
//   - UseCase の入出力を検証する方法
// ============================================================

import { describe, it, expect, vi } from "vitest";
import { SyncUser } from "../sync-user";
import type { UserRepository } from "@/application/ports";
import type { User } from "@/domain/entities";

// ── モックの作り方 ──────────────────────────────────
// UseCase は UserRepository に依存していますが、
// テストでは本物の DB に繋ぎたくないので「偽物（モック）」を使います。
//
// vi.fn() は「呼ばれたことを記録する偽の関数」を作ります。
// .mockResolvedValue() で「この値を返す」と設定できます。

function createMockUserRepository(): UserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    findPublicProfileBySlug: vi.fn(),
    upsertPublicProfile: vi.fn(),
  };
}

describe("SyncUser UseCase", () => {
  it("ユーザー情報を渡すと、UserRepository.create が呼ばれる", async () => {
    // ── Arrange（準備）──────────────────────
    const mockRepo = createMockUserRepository();

    // create が呼ばれたときに返す偽のユーザーデータ。
    const fakeUser: User = {
      id: "user-1",
      email: "test@example.com",
      name: "テストユーザー",
      image: null,
      createdAt: new Date("2026-01-01"),
    };
    // mockResolvedValue: Promise で包んで返してくれる。
    (mockRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(fakeUser);

    // UseCase にモックを注入。
    const useCase = new SyncUser({ userRepository: mockRepo });

    // ── Act（実行）────────────────────────
    const result = await useCase.execute({
      id: "user-1",
      email: "test@example.com",
      name: "テストユーザー",
    });

    // ── Assert（検証）──────────────────────
    // 1) 戻り値が期待通りか？
    expect(result.id).toBe("user-1");
    expect(result.email).toBe("test@example.com");

    // 2) create が正しい引数で呼ばれたか？
    expect(mockRepo.create).toHaveBeenCalledWith({
      id: "user-1",
      email: "test@example.com",
      name: "テストユーザー",
    });

    // 3) create が1回だけ呼ばれたか？
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });

  it("image が渡された場合も正しく処理される", async () => {
    const mockRepo = createMockUserRepository();
    const fakeUser: User = {
      id: "user-2",
      email: "photo@example.com",
      name: "写真ユーザー",
      image: "https://example.com/photo.jpg",
      createdAt: new Date("2026-01-01"),
    };
    (mockRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(fakeUser);

    const useCase = new SyncUser({ userRepository: mockRepo });
    const result = await useCase.execute({
      id: "user-2",
      email: "photo@example.com",
      name: "写真ユーザー",
      image: "https://example.com/photo.jpg",
    });

    expect(result.image).toBe("https://example.com/photo.jpg");
  });
});
