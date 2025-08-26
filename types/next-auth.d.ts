import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      provider?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string; // NextAuth uses `sub` for user id
  }
}
