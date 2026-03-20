import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      plan?: string;
      trialEndDate?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan?: string;
    trialEndDate?: string | null;
    customerImage?: string | null;
    customerName?: string | null;
  }
}
