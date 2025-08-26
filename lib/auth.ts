import {
  type NextAuthOptions,
  type Session,
  type User
} from "next-auth";
import { type JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import * as bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Create a dedicated Prisma client for NextAuth
// This prevents connection issues with the adapter
const prismaForAuth = globalThis.prismaAuth ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaAuth = prismaForAuth;
}

declare global {
  var prismaAuth: PrismaClient | undefined;
}

export interface Credentials {
  email: string;
  password: string;
}

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  
  interface User {
    id: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaForAuth),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Credentials | undefined
      ): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prismaForAuth.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        // Return a shape compatible with NextAuth's `User`
        const result: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };

        return result;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    verifyRequest: "/verify-email",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user already exists
          const existingUser = await prismaForAuth.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            // Update existing user with Google profile info if missing
            const nameParts = user.name?.split(" ") || [];
            const firstName = nameParts[0] || null;
            const lastName = nameParts.slice(1).join(" ") || null;

            await prismaForAuth.user.update({
              where: { id: existingUser.id },
              data: {
                name: existingUser.name || user.name,
                firstName: existingUser.firstName || firstName,
                lastName: existingUser.lastName || lastName,
                image: existingUser.image || user.image,
                provider: "google",
              },
            });
          }
          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (session.user && token?.sub) {
        session.user.id = token.sub;
        
        // Fetch additional user data from database
        const dbUser = await prismaForAuth.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            provider: true,
          },
        });

        if (dbUser) {
          session.user = {
            ...session.user,
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email!,
            image: dbUser.image,
          };
        }
      }
      return session;
    },
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: any }): Promise<JWT> {
      if (user) {
        token.sub = user.id;
        
        // Handle new Google users - populate additional profile fields
        if (account?.provider === "google") {
          try {
            // Check if this user needs profile fields populated
            const dbUser = await prismaForAuth.user.findUnique({
              where: { id: user.id },
              select: { firstName: true, lastName: true, provider: true },
            });
            
            // If user doesn't have firstName/lastName or provider set, update them
            if (dbUser && (!dbUser.firstName || !dbUser.provider)) {
              const nameParts = user.name?.split(" ") || [];
              const firstName = nameParts[0] || null;
              const lastName = nameParts.slice(1).join(" ") || null;

              await prismaForAuth.user.update({
                where: { id: user.id },
                data: {
                  firstName,
                  lastName,
                  provider: "google",
                },
              });
            }
          } catch (error) {
            console.error("Error updating Google user profile:", error);
          }
        }
      }
      if (account?.provider === "google") {
        token.provider = "google";
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET as string,
};
