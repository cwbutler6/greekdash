Thanks! I’ll look into how to resolve the `OAuthAccountNotLinked` error in NextAuth.js when switching from email login to Google login using the same email address. I’ll also check best practices for enabling account linking and using the Prisma adapter. I’ll get back to you shortly with a solution.


# Fixing the `OAuthAccountNotLinked` Error

When a user first signs in with one provider (e.g. email/magic-link) and later tries to sign in with Google using the **same email**, NextAuth by default will **not** merge those accounts. Instead it throws `OAuthAccountNotLinked`, meaning “an account exists with that email, but it isn’t linked to this OAuth provider”.  This is intentional for security: NextAuth treats each provider login as a separate user unless explicitly linked. By default, **automatic account linking is disabled** to prevent malicious account hijacking.

To fix this, you must *enable* account linking and use a database adapter so that NextAuth can actually merge the provider records. In practice the solution is to:

* **Use a database adapter** (e.g. Prisma or Supabase). NextAuth needs to store Users and Accounts in a database to link them. Without a database, NextAuth only uses JWT sessions and *cannot* merge identities. For example, the Prisma adapter will create `User` and `Account` tables and provides the internal `linkAccount` method.
* **Enable “dangerous” email account linking** on your OAuth provider(s) by setting `allowDangerousEmailAccountLinking: true`. This tells NextAuth to automatically merge the Google account into the existing user that has the same email.

Together, these changes let the same user authenticate via email or Google interchangeably. Below is a detailed summary.

## Why It Happens

NextAuth’s `OAuthAccountNotLinked` error means exactly what it says: “an account already exists with this email, but it isn’t linked to the OAuth provider you just used.”  In other words, the user signed up via Email (creating a User record and an Account record of type “email”), and now signing in with Google (which would create a User or Account record of type “google”). By default NextAuth **does not merge them**, so it refuses the login. This behavior is by design for security reasons. As the NextAuth FAQ explains, automatic linking between arbitrary providers can be **exploited by attackers** unless you trust the provider’s email verification. (Most OAuth providers *do* verify emails – e.g. Google always verifies – but NextAuth errs on the side of caution by default.)

## Enabling Safe Account Linking

If you trust your OAuth provider to verify emails, you can enable account linking per provider. For example, in your NextAuth configuration add `allowDangerousEmailAccountLinking: true` to the Google provider. The docs say:

> *“Normally, when you sign in with an OAuth provider and another account with the same email address already exists, the accounts are not linked automatically... Automatic account linking is not secure between arbitrary providers and is disabled by default... Just set `allowDangerousEmailAccountLinking: true` in your provider configuration to enable automatic account linking.”*.

In practice, your providers config might look like this:

```js
// [...nextauth].js
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default NextAuth({
  // Use a database adapter (e.g. Prisma) to persist users and accounts
  adapter: PrismaAdapter(prisma),  
  providers: [
    EmailProvider({
      // your email provider config (e.g. SMTP settings)
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Enable automatic linking by matching email
      allowDangerousEmailAccountLinking: true,
    }),
    // ...add other providers with allowDangerousEmailAccountLinking as needed
  ],
  // (other NextAuth options)
})
```

With `allowDangerousEmailAccountLinking: true`, NextAuth will automatically call the adapter’s `linkAccount` method instead of erroring. The result is that one **User** record in the database now has **two Accounts** (one “email” account and one “google” account) – i.e. the accounts are merged into one user. Several community answers confirm that simply adding this flag to the provider configuration “solved” the `OAuthAccountNotLinked` error.

### Trust and Security

The “dangerous” in `allowDangerousEmailAccountLinking` is a warning: you are telling NextAuth it’s okay to trust the OAuth provider’s email verification. Google (and GitHub, Microsoft, etc.) do verify emails, so in these cases it’s generally safe to enable linking. If you have concerns, you can also implement a manual flow: for example, catch the `OAuthAccountNotLinked` error on your custom sign-in page (via `error=OAuthAccountNotLinked` in the URL), and prompt the user to first sign in with their original provider and then link accounts. For instance, you could ask the user to log in via email and then “connect Google” within an authenticated session, calling NextAuth’s `linkAccount` (via a custom callback). In other words, you can manually link by detecting an existing session in a sign-in callback and invoking your adapter, but this requires more custom code.

## Database Adapter (Prisma/Supabase)

To make linking work, you must use a database adapter. NextAuth needs to **persist user and account records** in tables so it can merge them. The Prisma adapter is a common choice (especially if you already use Prisma to manage your Supabase or Postgres DB). For example, the NextAuth Prisma adapter adds the tables and methods (`getUser`, `createUser`, `getUserByAccount`, `linkAccount`, etc.) needed to store linked accounts. Without an adapter (i.e. using JWT sessions only), NextAuth has no place to store the second account, and linking won’t work.

> **Note:** If you’re using Supabase (Postgres) as your database, you can either use the Prisma adapter (pointing it to your Supabase DB), or use the community Supabase adapter. The Supabase adapter (`@auth/supabase-adapter`) will store NextAuth data in a Supabase “next\_auth” schema. Prisma or Supabase adapter – either will allow NextAuth to call `linkAccount` under the hood.

Once your adapter is set up, ensure your database is migrated/ready. With the Prisma adapter, you’d typically have a schema like:

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  // other fields...
  accounts      Account[]
  sessions      Session[]
}
model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
// ...VerificationToken for email sign-in...
```

After setting up the adapter and tables, NextAuth will handle storing and linking automatically.

## Configuration Example

Putting it together, a working NextAuth configuration might look like this:

```js
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default NextAuth({
  adapter: PrismaAdapter(prisma),  // Use Prisma (Postgres) to store users, accounts, etc.
  providers: [
    EmailProvider({
      // Email/magic-link provider settings
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Crucial: enable account linking by email
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // Optionally, you can inspect/override the sign-in or session callbacks here
  },
  pages: {
    // Optionally customize the error page to handle `?error=OAuthAccountNotLinked`
    error: "/auth/error",  // e.g. a React page that reads router.query.error
  },
})
```

**Key points in the config above:**

* We set `adapter: PrismaAdapter(prisma)` so NextAuth will persist Users and Accounts in our database.
* We added `allowDangerousEmailAccountLinking: true` to the Google provider. This tells NextAuth to automatically merge the Google sign-in with any existing user that has the same email.

After this, signing in first via email and then via Google will result in **one user** with two linked accounts, instead of an error.

## Summary of Steps

1. **Configure a database adapter.** Install and configure (for example) the Prisma adapter (`@next-auth/prisma-adapter`) or Supabase adapter, and run migrations so the User/Account/Session tables exist. NextAuth uses this to store account links.
2. **Enable “dangerous” linking on the provider.** In your NextAuth providers array, pass `allowDangerousEmailAccountLinking: true` to the Google (and any other OAuth) provider. This tells NextAuth to merge accounts by email.
3. **Test the flow.** When a user signs in with Email (magic link) and then later with Google (same email), they should no longer see the error. Instead, NextAuth will link the Google account into the same user record (one user with two linked accounts).
4. **(Optional) Handle error UI.** You can customize NextAuth’s sign-in or error page to handle the `OAuthAccountNotLinked` error explicitly (e.g. instruct users to link accounts), but with `allowDangerousEmailAccountLinking` it should not appear for Google/email cases.

**Result:** With the above changes, users can authenticate via email *or* Google (or both), as long as the email is the same. The accounts will be safely merged in your database, and `OAuthAccountNotLinked` will no longer occur.

**Sources:** Official NextAuth documentation and community answers explain that setting `allowDangerousEmailAccountLinking: true` in the provider config enables the adapter’s `linkAccount` method, and that a database adapter (Prisma, Supabase, etc.) is required to store the linked accounts. These measures allow one user to have both Email and Google login linked to the same email address.
