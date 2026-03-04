import { NextResponse, NextRequest } from "next/server";
import { requireUserId } from "@/interface/http/auth-user";
import { createRemoveTagFromEntryUseCase } from "@/interface/http/use-case-factory";

// DELETE /api/entries/[id]/tags/[tagId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id, tagId } = await params;

    const useCase = createRemoveTagFromEntryUseCase();
    await useCase.execute({
      userId,
      entryId: id,
      tagId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove tag from entry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
