import { requireUserId } from "@/interface/http/auth-user";
import { createToggleBookmarkUseCase } from "@/interface/http/use-case-factory";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { errorResponse } from "@/interface/http/api-error";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // 認証と users整合を通したうえで対象entryを更新する。
    const userId = await requireUserId();
    const { id } = await context.params;

    // route層ではUseCase呼び出しのみに集中する。
    const useCase = createToggleBookmarkUseCase();
    const result = await useCase.execute({
      userId,
      entryId: id,
      isBookmarked: true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error, "POST /api/entries/[id]/bookmark");
  }
}
