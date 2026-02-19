import { EntryNotFoundError } from "@/application/use-cases";
import { requireUserId, UnauthorizedError } from "@/interface/http/auth-user";
import { createMarkEntryReadUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;

    const useCase = createMarkEntryReadUseCase();
    const result = await useCase.execute({
      userId,
      entryId: id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof EntryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
