import { NextResponse, NextRequest } from "next/server";
import { requireUserId } from "@/interface/http/auth-user";
import { createCreateTag } from "@/interface/http/use-case-factory";
import { createTagSchema } from "@/interface/http/schemas/tag-schemas";
import { createRepositories } from "@/infrastructure/db";

export async function GET() {
  try {
    const userId = await requireUserId();

    // The use case doesn't exist for just listing tags, so we call the repo directly 
    // to match the pattern of other simple queries.
    const repositories = createRepositories();
    const tags = await repositories.tagRepository.listByUserId(userId);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/tags
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();

    const body = await request.json();
    const result = createTagSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const useCase = createCreateTag();
    const tag = await useCase.execute({
      userId,
      name: result.data.name,
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
