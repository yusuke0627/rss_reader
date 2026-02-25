import { requireUserId } from "@/interface/http/auth-user";
import { createSummarizeEntryUseCase } from "@/interface/http/use-case-factory";
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/interface/http/api-error";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;

    const useCase = createSummarizeEntryUseCase();
    const result = await useCase.execute({
      userId,
      entryId: id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponse(error, "POST /api/entries/[id]/summarize");
  }
}
