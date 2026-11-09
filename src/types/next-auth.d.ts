import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    login?: string | undefined;
    contaId?: string | undefined;
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}
