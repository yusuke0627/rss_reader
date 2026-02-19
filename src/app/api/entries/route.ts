import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUserId, UnauthorizedError } from "@/interface/http/auth-user";
import { createSearchEntriesUseCase } from "@/interface/http/use-case-factory";
import { searchEntriesQuerySchema } from "@/interface/http/schemas/search-entries-query-schema";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const query = searchEntriesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

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
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
