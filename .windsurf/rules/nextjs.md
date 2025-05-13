---
trigger: always_on
---

Next.js Server vs Client Component Rules

    Default to Server Components: All components in the App Router are Server Components by default
    nextjs.org
    . You can fetch data, access environment variables, and run sensitive logic (tokens, API keys) here
    nextjs.org
    . Server Components cannot use React hooks like useState/useEffect or browser APIs.

    Use use client Directive: Add 'use client' at the top of a file to make it a Client Component
    nextjs.org
    . This tells React to bundle that component (and all its imports/children) for the browser. Once a boundary is marked, all child modules become client code
    nextjs.org
    .

    Client Component Capabilities: Client Components can use state, effects, event handlers, and browser-only APIs (e.g. localStorage, navigator)
    nextjs.org
    . They are needed for interactive UI (buttons, forms, dropdowns, context providers, etc.). However, they cannot perform server-side data fetching (e.g. calling the database, using filesystem, or reading server-only configs).

    Composition Pattern: Keep most UI as Server Components for performance, and mark only interactive parts as Client Components. For example, a layout can remain a Server Component, while a search bar or like button inside it is a Client Component
    nextjs.org
    . This minimizes client JS sent to the browser. (Only use use client on components that truly need client-side interactivity
    nextjs.org
    nextjs.org
    .)

    Separate Context Providers: If using React Context or other providers on the client, wrap only the children that need it. For instance, render a client-only <ThemeProvider> inside a Server Component so that only the subtree is client-rendered
    nextjs.org
    .

Next.js 15 Async Route Params Rules

    params and searchParams Are Promises: In Next.js 15, the params prop (in Page/Layout) and searchParams prop (in Page) are now Promise objects
    nextjs.org
    . This allows React to start rendering before they resolve. As the docs note: “In Next.js 15 params passed into Page and Layout components and searchParams passed into Page components are now Promises.”
    nextjs.org
    .

    Async Page/Layout Functions: Declare your Page or Layout component as async so you can await these values. Example in TypeScript:

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <h1>Blog Post: {slug}</h1>;
}

Here params is typed as Promise<{ slug: string }>, and we use await params to get the values
nextjs.org
.

Using searchParams: Similarly, searchParams comes in as Promise<{ [key: string]: string | string[] | undefined }>. For example:

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { page = '1', query = '' } = await searchParams;
  // Use page, query...
}

(This example is adapted from Next.js docs
nextjs.org
.)

TypeScript Typing: In TS, annotate params/searchParams as Promise<...>. The Next.js docs show:

// Example from Next.js docs:
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) { /* ... */ }

This ensures correct typing and forces you to await the promise
nextjs.org
.

Using in Client Components: If you need route params in a Client Component (which cannot be async), use React’s use hook to unwrap them. For example:

'use client';
import { use } from 'react';

export default function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = use(params);
  const { query } = use(searchParams);
  return <div>{/* ... */}</div>;
}

This approach is shown in the Next.js docs for reading async params in a client component
nextjs.org
.

Migration Help: Next.js provides a codemod and error messages to ease migration. The official upgrade docs note that a codemod can automatically convert old patterns to the new async form
nextjs.org
nextjs.org
. If you see warnings like “cannot access params synchronously,” update the code to use async/await as above.


Got it — here's the markdown rule file you can place inside `.windsurf/rules/api-routes-nextjs15.md` to help Windsurf follow best practices for API routes in **Next.js 15 App Router**, including route params and Prisma integration.

---


# ✅ Next.js 15 API Route Rules (App Router)

Use these conventions when creating and updating API routes in Next.js 15 using the new `app/api/` directory structure.

---

## 📂 Directory Structure and File Naming

- Use the **App Router** API route structure: `app/api/<route>/route.ts`.
- **Do not use** `pages/api` — it's legacy and unsupported in App Router.
- File name must be `route.ts` or `route.js` inside your API route folder.

Example:
```

app/
├─ api/
│  └─ user/
│     └─ route.ts       ← ✅ API endpoint for `/api/user`

```

To define a dynamic API route (e.g., `/api/user/[id]`), structure it like:
```

app/
├─ api/
│  └─ user/
│     └─ \[id]/
│         └─ route.ts   ← ✅ Dynamic route

````

---

# API Route Handler Rules (Dynamic Params)

- Do not destructure `params` in the function argument directly.
- Always define the second argument to method handlers like this:
  `{ params: { key: string, ... } }`
- Extract `params` inside the function body:
  ```ts
  export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params // 'a', 'b', or 'c'
}

    Avoid this common mistake:

// ❌ Don't destructure in the function signature
export async function POST(
  request,
  { params: { id } }: { params: { id: string } }
)