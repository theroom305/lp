import NextAuth from "next-auth";

import {env} from "@/server/env";

export const {handlers, auth, signIn, signOut} = NextAuth({
  providers: [],
  session: {
    strategy: "jwt",
  },
  secret: env.AUTH_SECRET,
  // TODO Step 5: add GoogleProvider with email allowlist for Dan + Isaac; add Drizzle adapter against separate auth_users/auth_accounts/auth_sessions/auth_verification_tokens tables (NOT the CRM persons/sessions tables).
});
