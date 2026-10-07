import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Behind a reverse proxy (Traefik/Cloudflare) Auth.js v5 rejects the
  // forwarded Host unless we explicitly trust it, otherwise non-admin login
  // fails with "UntrustedHost" → /api/auth/error?error=Configuration.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const limit = checkRateLimit("memberLogin", [
          getClientIp(request.headers),
          email,
        ]);
        if (!limit.allowed) return null;

        const member = await prisma.member.findUnique({
          where: { email },
        });

        if (!member) return null;

        const valid = await bcrypt.compare(credentials.password, member.passwordHash);

        if (!valid) return null;

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          memberType: member.type,
          memberStatus: member.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.memberType = (user as Record<string, unknown>).memberType;
        token.memberStatus = (user as Record<string, unknown>).memberStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.memberType = token.memberType;
        user.memberStatus = token.memberStatus;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});
