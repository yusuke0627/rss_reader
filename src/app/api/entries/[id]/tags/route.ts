import { NextResponse, NextRequest } from "next/server";
import { requireUserId } from "@/interface/http/auth-user";
import { createAddTagToEntryUseCase } from "@/interface/http/use-case-factory";
import { z } from "zod";

const addTagToEntrySchema = z.object({
  tagId: z.string().min(1, "Tag ID is required"),
});

// POST /api/entries/[id]/tags
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const body = await request.json();
    const result = addTagToEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const useCase = createAddTagToEntryUseCase();
    await useCase.execute({
      userId,
      entryId: id,
      tagId: result.data.tagId,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Tag not found") {
      return NextResponse.json({ error: "Tag not found or unowned" }, { status: 404 });
    }
    console.error("Failed to add tag to entry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
