import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/interface/http/auth-user";
import { createSearchEntriesUseCase } from "@/interface/http/use-case-factory";
import { searchEntriesQuerySchema } from "@/interface/http/schemas/search-entries-query-schema";
import { errorResponse } from "@/interface/http/api-error";

export async function GET(request: NextRequest) {
  try {
    // 1) 認証と users整合。
    const userId = await requireUserId();
    // 2) クエリ文字列を zod で構造化。
    const query = searchEntriesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    // 3) 一覧取得ロジックは UseCase に委譲。
    const useCase = createSearchEntriesUseCase();
    const entries = await useCase.execute({
      userId,
      feedId: query.feedId,
      folderId: query.folderId,
      tagId: query.tagId,
      unreadOnly: query.unread,
      search: query.search,
      limit: query.limit,
      cursor: query.cursor,
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "GET /api/entries");
  }
}
