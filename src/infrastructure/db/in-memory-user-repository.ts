import type { UserRepository } from "@/application/ports";
import type { PublicProfile, User } from "@/domain/entities";
import { createId, inMemoryStore } from "./in-memory-store";

export class InMemoryUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    return inMemoryStore.users.find((item) => item.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return inMemoryStore.users.find((item) => item.email === email) ?? null;
  }

  async create(input: {
    id?: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }): Promise<User> {
    if (input.id) {
      const existingById = await this.findById(input.id);
      if (existingById) {
        return existingById;
      }
    }

    const existing = await this.findByEmail(input.email);
    if (existing) {
      return existing;
    }

    const user: User = {
      id: input.id ?? createId(),
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
      createdAt: new Date(),
    };

    inMemoryStore.users.push(user);
    return user;
  }

  async findPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
    return inMemoryStore.publicProfiles.find((item) => item.publicSlug === slug) ?? null;
  }

  async upsertPublicProfile(input: {
    userId: string;
    publicSlug: string;
    isPublic: boolean;
  }): Promise<PublicProfile> {
    const existing = inMemoryStore.publicProfiles.find((item) => item.userId === input.userId);
    if (existing) {
      existing.publicSlug = input.publicSlug;
      existing.isPublic = input.isPublic;
      return existing;
    }

    const profile: PublicProfile = {
      userId: input.userId,
      publicSlug: input.publicSlug,
      isPublic: input.isPublic,
    };
    inMemoryStore.publicProfiles.push(profile);
    return profile;
  }
}
