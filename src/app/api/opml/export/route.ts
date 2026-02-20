import {
  InvalidSessionError,
  requireUserId,
  UnauthorizedError,
} from "@/interface/http/auth-user";
import { createExportOpmlUseCase } from "@/interface/http/use-case-factory";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userId = await requireUserId();

    const useCase = createExportOpmlUseCase();
    const xml = await useCase.execute({ userId });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="subscriptions.opml"',
      },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof InvalidSessionError
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/opml/export failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
