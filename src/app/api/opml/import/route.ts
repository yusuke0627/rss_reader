import {
  InvalidSessionError,
  requireUserId,
  UnauthorizedError,
} from "@/interface/http/auth-user";
import { createImportOpmlUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No OPML file provided" },
        { status: 400 },
      );
    }

    const opmlContent = await file.text();
    const useCase = createImportOpmlUseCase();
    const result = await useCase.execute({
      userId,
      opmlContent,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof InvalidSessionError
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/opml/import failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
