import { NotFoundError } from "@/application/use-cases";
import { createGetPublicEntriesUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const p = await params;

    // Pagination params
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
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/public/[slug] failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
