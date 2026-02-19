import { InvalidFeedUrlError } from "@/application/use-cases";
import { requireUserId, UnauthorizedError } from "@/interface/http/auth-user";
import { createRegisterFeedUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";

interface RegisterFeedBody {
  url?: string;
  folderId?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = (await request.json()) as RegisterFeedBody;

    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const useCase = createRegisterFeedUseCase();
    const result = await useCase.execute({
      userId,
      url: body.url,
      folderId: body.folderId ?? null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof InvalidFeedUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
