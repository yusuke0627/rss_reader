import type { PublicProfile, User } from "@/domain/entities";

// 認証ユーザーの同期と公開プロフィール管理の契約。
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: {
    id?: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }): Promise<User>;
  findPublicProfileBySlug(slug: string): Promise<PublicProfile | null>;
  upsertPublicProfile(input: {
    userId: string;
    publicSlug: string;
    isPublic: boolean;
  }): Promise<PublicProfile>;
}
