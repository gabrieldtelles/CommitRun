import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const loginHabilitado = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && process.env.AUTH_SECRET,
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: loginHabilitado ? [GitHub] : [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.login = typeof profile.login === "string" ? profile.login : undefined;
        token.contaId = String(profile.id ?? token.sub ?? "");
      }
      return token;
    },
    session({ session, token }) {
      session.user.login = typeof token.login === "string" ? token.login : undefined;
      session.user.contaId = typeof token.contaId === "string" ? token.contaId : undefined;
      return session;
    },
  },
});
