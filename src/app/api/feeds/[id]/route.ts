import { requireUserId } from "@/interface/http/auth-user";
import { createUnsubscribeFeedUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/interface/http/api-error";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id: feedId } = await params;

    const useCase = createUnsubscribeFeedUseCase();
    await useCase.execute({
      userId,
      feedId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error, "DELETE /api/feeds/[id]");
  }
}
