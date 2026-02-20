import { NextResponse } from "next/server";
import { createSyncFeedsUseCase } from "@/interface/http/use-case-factory";
import { errorResponse } from "@/interface/http/api-error";

export async function POST(request: Request) {
  // Vercel Cron などで使用される秘密鍵の検証。
  // 必要に応じて .env に CRON_SECRET を設定してください。
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const useCase = createSyncFeedsUseCase();
    const result = await useCase.execute({ limit: 20 });

    console.log("[Cron] Fetch feeds result:", result);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "[Cron] Fetch feeds");
  }
}
