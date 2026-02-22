import { createGetPublicEntriesUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/interface/http/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const p = await params;

    // ページネーションパラメータ
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor") || undefined;

    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const useCase = createGetPublicEntriesUseCase();
    const entries = await useCase.execute({
      slug: p.slug,
      limit: isNaN(limit) ? 50 : limit,
      cursor,
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "GET /api/public/[slug]");
  }
}
