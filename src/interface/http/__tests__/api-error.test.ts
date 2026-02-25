// ============================================================
// サンプルテスト①: errorResponse() ヘルパーのテスト
// ============================================================
// 【学習ポイント】
//   - describe / it / expect の基本構造
//   - テストの命名規則（日本語でもOK）
//   - レスポンスオブジェクトの検証方法
// ============================================================

import { describe, it, expect, vi } from "vitest";

// next-auth は Vitest の Node.js 環境では ESM 解決に失敗するため、
// auth モジュール全体をモック化します。
// テスト対象は errorResponse() であり、実際の認証処理は不要です。
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { errorResponse } from "../api-error";
import { UnauthorizedError, InvalidSessionError } from "../auth-user";
import {
  EntryNotFoundError,
  InvalidFeedUrlError,
} from "@/application/use-cases";
import { ZodError } from "zod";

// ── describe: テスト対象をグループ化する ──────────────────
// 「何をテストしているか」を明確にするためのブロックです。
// ネスト（入れ子）にもできます。
describe("errorResponse", () => {
  // ── it: 1つのテストケース ───────────────────────────
  // 「〇〇のとき、△△になるべき」という形で書きます。

  // --- 認証エラー系 ---
  describe("認証エラー", () => {
    it("UnauthorizedError → 401 + UNAUTHORIZED コード", async () => {
      const res = errorResponse(new UnauthorizedError());

      // expect(...).toBe(...) で「値が一致するか」を検証します。
      expect(res.status).toBe(401);

      // レスポンスのボディ（JSON）を取り出して検証します。
      const body = await res.json();
      expect(body.code).toBe("UNAUTHORIZED");
      expect(body.message).toBe("Unauthorized");
    });

    it("InvalidSessionError → 401 + UNAUTHORIZED コード", async () => {
      const res = errorResponse(new InvalidSessionError());

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe("UNAUTHORIZED");
    });
  });

  // --- バリデーションエラー系 ---
  describe("バリデーションエラー", () => {
    it("ZodError → 400 + VALIDATION_ERROR コード + details 付き", async () => {
      // ZodError を手動で作成します。
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          path: ["url"],
          message: "Required",
        },
      ]);

      const res = errorResponse(zodError);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
      // details 配列が存在し、中身があることを検証。
      expect(body.details).toBeDefined();
      expect(body.details.length).toBeGreaterThan(0);
    });

    it("InvalidFeedUrlError → 400 + VALIDATION_ERROR コード", async () => {
      const res = errorResponse(new InvalidFeedUrlError("bad-url"));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
    });
  });

  // --- Not Found 系 ---
  describe("リソース未検出", () => {
    it("EntryNotFoundError → 404 + NOT_FOUND コード", async () => {
      const res = errorResponse(new EntryNotFoundError("entry-123"));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe("NOT_FOUND");
      // メッセージに entryId が含まれていることを検証。
      expect(body.message).toContain("entry-123");
    });
  });

  // --- 想定外のエラー（500）---
  describe("内部エラー", () => {
    it("一般的な Error → 500 + INTERNAL_ERROR コード", async () => {
      const res = errorResponse(new Error("something broke"));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe("INTERNAL_ERROR");
      // セキュリティ上、内部の詳細メッセージは外に出さない。
      expect(body.message).toBe("Internal Server Error");
    });

    it("文字列エラー → 500 + INTERNAL_ERROR コード", async () => {
      const res = errorResponse("unknown failure");

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe("INTERNAL_ERROR");
    });
  });
});
