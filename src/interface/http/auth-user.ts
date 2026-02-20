import { auth } from "@/auth";
import { createRepositories } from "@/infrastructure/db";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class InvalidSessionError extends Error {
  constructor() {
    super("Authenticated session is missing user email");
    this.name = "InvalidSessionError";
  }
}

export async function requireUserId(): Promise<string> {
  // API の共通認証ゲート。
  // route.ts からはこの関数だけ呼べば「認証 + users整合」を担保できる。
  const session = await auth();
  const user = session?.user;
  const userId = user?.id;
  if (!userId) {
    throw new UnauthorizedError();
  }

  if (!user?.email) {
    throw new InvalidSessionError();
  }

  // 外部キー(user_id -> users.id)で失敗しないよう、認証済みユーザーを必ず作成/更新する。
  const repositories = createRepositories();
  const dbUser = await repositories.userRepository.create({
    id: userId,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
  });

  return dbUser.id;
}
