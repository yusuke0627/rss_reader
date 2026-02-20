import type { UserRepository } from "@/application/ports";
import type { User } from "@/domain/entities";

export interface SyncUserInput {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface SyncUserDependencies {
  userRepository: UserRepository;
}

export class SyncUser {
  constructor(private readonly deps: SyncUserDependencies) {}

  async execute(input: SyncUserInput): Promise<User> {
    return await this.deps.userRepository.create(input);
  }
}
