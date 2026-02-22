import { requireUserId } from "@/interface/http/auth-user";
import { createImportOpmlUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/interface/http/api-error";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "OPML ファイルが指定されていません",
        },
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
    return errorResponse(error, "POST /api/opml/import");
  }
}
