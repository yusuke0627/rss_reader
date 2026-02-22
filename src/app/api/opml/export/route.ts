import { requireUserId } from "@/interface/http/auth-user";
import { createExportOpmlUseCase } from "@/interface/http/use-case-factory";
import { NextResponse } from "next/server";
import { errorResponse } from "@/interface/http/api-error";

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
    return errorResponse(error, "GET /api/opml/export");
  }
}
