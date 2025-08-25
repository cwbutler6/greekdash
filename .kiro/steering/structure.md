# Project Structure

## App Router Organization

### Route Groups
- `(auth)` - Authentication pages (login, signup, forgot-password)
- `(chapter)` - Member portal routes with chapter slug
- `(chapter-admin)` - Admin dashboard routes with chapter slug
- `[chapterSlug]` - Public chapter pages (landing, donations)

### Key Routing Patterns
```
/[chapterSlug]                    # Public chapter landing page
/[chapterSlug]/join               # Chapter join/recruitment
/[chapterSlug]/donations          # Public donation page
/[chapterSlug]/portal/*           # Member portal (auth required)
/[chapterSlug]/admin/*            # Admin dashboard (admin auth required)
```

## Source Code Structure

### `/src/app`
- **API Routes**: `/api` - RESTful endpoints organized by resource
- **Page Components**: Route-specific page components
- **Layout Files**: Shared layouts for route groups
- **Actions**: Server actions for form handling

### `/src/components`
- **UI Components**: `/ui` - shadcn/ui components with customizations
- **Feature Components**: Organized by domain (auth, chapters, finance, etc.)
- **Providers**: Context providers for auth, feedback, etc.

### `/src/lib`
- **Core Services**: Database, authentication, external APIs
- **Utilities**: Formatting, validation, shared helpers
- **Validations**: Zod schemas organized by feature
- **Services**: Business logic (finance-service, treasury-service)

### Key Directories
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (chapter)/         # Member portal routes
│   ├── (chapter-admin)/   # Admin routes
│   ├── [chapterSlug]/     # Public chapter routes
│   ├── api/               # API endpoints
│   └── actions/           # Server actions
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   ├── chapters/          # Chapter-specific components
│   ├── finance/           # Financial components
│   └── providers/         # React context providers
├── lib/
│   ├── services/          # Business logic services
│   ├── validations/       # Zod validation schemas
│   ├── supabase/          # Supabase utilities
│   └── utils/             # Helper functions
└── types/                 # TypeScript type definitions
```

## File Naming Conventions
- **Components**: PascalCase (e.g., `MembersList.tsx`)
- **Pages**: lowercase with hyphens (e.g., `forgot-password/page.tsx`)
- **Utilities**: camelCase (e.g., `auth-utils.ts`)
- **API Routes**: RESTful naming (e.g., `/api/chapters/[chapterSlug]/members`)

## Multi-tenant Architecture
- Chapter isolation through `chapterSlug` parameter
- Database queries always filtered by `chapterId`
- Authentication context includes chapter membership
- File uploads organized by chapter in Supabase storage

## Configuration Files
- **Database**: `prisma/schema.prisma` with custom client output
- **Styling**: `tailwind.config.ts` with emerald primary colors
- **Components**: `components.json` for shadcn/ui configuration
- **Environment**: `.env` files for secrets and configuration