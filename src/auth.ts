import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Auth.js のエントリポイント。
// route handler 側は `auth()` を呼ぶだけでセッションを取得できる。
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.id) return true;

      try {
        const { createSyncUserUseCase } =
          await import("@/interface/http/use-case-factory");
        const useCase = createSyncUserUseCase();
        await useCase.execute({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        });
      } catch (error) {
        console.error("[Auth] User sync failed:", error);
      }

      return true;
    },
    async session({ session, token }) {
      // API 層で user.id を使うため、JWT sub を session に移し替える。
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
