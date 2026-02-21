import { registerFeedSchema } from "@/interface/http/schemas/register-feed-schema";
import { requireUserId } from "@/interface/http/auth-user";
import { createRegisterFeedUseCase } from "@/interface/http/use-case-factory";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/interface/http/api-error";

export async function POST(request: NextRequest) {
  try {
    // 1) 認証と users整合を通す。
    const userId = await requireUserId();
    // 2) リクエストを zod で検証。
    const body = registerFeedSchema.parse(await request.json());

    // 3) UseCase に業務ロジックを委譲。
    const useCase = createRegisterFeedUseCase();
    const result = await useCase.execute({
      userId,
      url: body.url,
      folderId: body.folderId ?? null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error, "POST /api/feeds");
  }
}
