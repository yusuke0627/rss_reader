import { InvalidFeedUrlError } from "@/application/use-cases";
import { registerFeedSchema } from "@/interface/http/schemas/register-feed-schema";
import { InvalidSessionError, requireUserId, UnauthorizedError } from "@/interface/http/auth-user";
import { createRegisterFeedUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = registerFeedSchema.parse(await request.json());

    const useCase = createRegisterFeedUseCase();
    const result = await useCase.execute({
      userId,
      url: body.url,
      folderId: body.folderId ?? null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof InvalidSessionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof InvalidFeedUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 },
      );
    }

    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/feeds failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
