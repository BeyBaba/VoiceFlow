import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// Super user listesi — rate limit, plan kısıtlaması, trial süresi uygulanmaz
const SUPER_USERS = ["savasarac@gmail.com"];

export function isSuperUser(email: string | null | undefined): boolean {
  return !!email && SUPER_USERS.includes(email);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;

      const existing = await prisma.customer.findUnique({
        where: { email: user.email },
      });

      const superUser = isSuperUser(user.email);

      if (!existing) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);
        await prisma.customer.create({
          data: {
            email: user.email,
            name: user.name || null,
            image: user.image || null,
            googleId: profile?.sub || null,
            plan: superUser ? "lifetime" : "free",
            trialStartDate: superUser ? null : now,
            trialEndDate: superUser ? null : trialEnd,
          },
        });
      } else {
        await prisma.customer.update({
          where: { email: user.email },
          data: {
            name: user.name || existing.name,
            image: user.image || existing.image,
            googleId: profile?.sub || existing.googleId,
            // Super user her zaman lifetime
            ...(superUser
              ? { plan: "lifetime", trialStartDate: null, trialEndDate: null }
              : existing.plan === "free" && !existing.trialStartDate
                ? {
                    trialStartDate: new Date(),
                    trialEndDate: new Date(
                      Date.now() + 40 * 24 * 60 * 60 * 1000
                    ),
                  }
                : {}),
          },
        });
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      // Her sign-in veya token refresh'te DB'den güncel bilgileri al
      if (user?.email || trigger === "update") {
        const email = user?.email || (token.email as string);
        if (email) {
          const customer = await prisma.customer.findUnique({
            where: { email },
          });
          if (customer) {
            token.plan = customer.plan;
            token.trialEndDate = customer.trialEndDate?.toISOString() || null;
            token.customerImage = customer.image;
            token.customerName = customer.name;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.plan = (token.plan as string) || "free";
        session.user.trialEndDate = (token.trialEndDate as string) || null;
        if (token.customerImage) {
          session.user.image = token.customerImage as string;
        }
        if (token.customerName) {
          session.user.name = token.customerName as string;
        }
      }
      return session;
    },
  },
});
