import type { PublicProfile, User } from "@/domain/entities";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: { email: string; name?: string | null; image?: string | null }): Promise<User>;
  findPublicProfileBySlug(slug: string): Promise<PublicProfile | null>;
  upsertPublicProfile(input: {
    userId: string;
    publicSlug: string;
    isPublic: boolean;
  }): Promise<PublicProfile>;
}
