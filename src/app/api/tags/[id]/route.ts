import { NextResponse, NextRequest } from "next/server";
import { requireUserId } from "@/interface/http/auth-user";
import { createDeleteTag } from "@/interface/http/use-case-factory";

// DELETE /api/tags/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();

    const { id } = await params;

    const useCase = createDeleteTag();
    await useCase.execute({
      userId,
      tagId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Tag not found") {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    console.error("Failed to delete tag:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
