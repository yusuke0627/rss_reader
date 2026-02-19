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
    async session({ session, token }) {
      // API 層で user.id を使うため、JWT sub を session に移し替える。
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
