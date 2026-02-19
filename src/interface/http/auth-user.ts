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
  const session = await auth();
  const user = session?.user;
  const userId = user?.id;
  if (!userId) {
    throw new UnauthorizedError();
  }

  if (!user?.email) {
    throw new InvalidSessionError();
  }

  const repositories = createRepositories();
  await repositories.userRepository.create({
    id: userId,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
  });

  return userId;
}
