import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  UnauthorizedError,
  InvalidSessionError,
} from "@/interface/http/auth-user";
import {
  EntryNotFoundError,
  InvalidFeedUrlError,
} from "@/application/use-cases";

// ── エラーコード定義 ──────────────────────────────
export type ErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

// ── 共通エラーレスポンス型 ──────────────────────────
export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

// ── エラーレスポンスビルダー ─────────────────────────
// 各 route.ts の catch ブロックからこの関数を呼ぶだけで、
// エラーの種類に応じた統一レスポンスを返せる。
export function errorResponse(
  error: unknown,
  context?: string,
): NextResponse<ApiErrorBody> {
  // 1) 認証エラー → 401
  if (
    error instanceof UnauthorizedError ||
    error instanceof InvalidSessionError
  ) {
    return NextResponse.json(
      { code: "UNAUTHORIZED" as const, message: error.message },
      { status: 401 },
    );
  }

  // 2) バリデーションエラー (Zod) → 400
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR" as const,
        message: "リクエストの検証に失敗しました",
        details: error.issues,
      },
      { status: 400 },
    );
  }

  // 3) フィードURL不正 → 400
  if (error instanceof InvalidFeedUrlError) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR" as const, message: error.message },
      { status: 400 },
    );
  }

  // 4) リソース未検出 → 404
  if (error instanceof EntryNotFoundError) {
    return NextResponse.json(
      { code: "NOT_FOUND" as const, message: error.message },
      { status: 404 },
    );
  }

  // 5) NotFoundError (get-public-entries 用) → 404
  if (error instanceof Error && error.name === "NotFoundError") {
    return NextResponse.json(
      { code: "NOT_FOUND" as const, message: error.message },
      { status: 404 },
    );
  }

  // 6) その他 → 500
  if (context) {
    console.error(`${context} failed:`, error);
  }
  return NextResponse.json(
    { code: "INTERNAL_ERROR" as const, message: "Internal Server Error" },
    { status: 500 },
  );
}
