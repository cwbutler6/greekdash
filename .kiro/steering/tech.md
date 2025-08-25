# Technology Stack

## Core Framework

- **Next.js 15** with App Router architecture
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library (New York style)

## Database & ORM

- **PostgreSQL** via Supabase
- **Prisma ORM** with custom output directory (`src/generated/prisma`)
- Database migrations managed through Prisma

## Authentication & Security

- **NextAuth.js v4** for multi-tenant authentication
- **bcrypt** for password hashing
- **Sentry** for error monitoring and performance tracking

## Payment & Communication

- **Stripe** for subscriptions and payment processing
- **Twilio** for SMS communications
- **Resend** for email delivery

## Testing & Quality

- **Vitest** for unit and integration testing
- **Playwright** for end-to-end testing
- **ESLint** with Next.js configuration

## Build & Development

- **pnpm** as package manager
- **Turbopack** for faster development builds
- **TypeScript** with strict configuration

## Common Commands

### Development

```bash
pnpm dev              # Start development server with Turbopack
pnpm build            # Build for production (includes Prisma generate)
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Database

```bash
pnpm prisma:generate  # Generate Prisma client
pnpm db:migrate       # Deploy migrations
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database
pnpm db:reset:seed    # Reset and seed database
```

### Testing

```bash
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests only
pnpm test:integration # Run integration tests
pnpm test:e2e         # Run Playwright tests
pnpm test:coverage    # Run tests with coverage
pnpm test:watch       # Run tests in watch mode
```

### Supabase

```bash
pnpm supabase:start   # Start local Supabase
pnpm supabase:dashboard # Open Supabase dashboard
```

## Key Dependencies

- **@prisma/client**: Database client
- **@radix-ui/***: Headless UI components
- **react-hook-form**: Form management
- **zod**: Schema validation
- **date-fns**: Date utilities
- **lucide-react**: Icon library
- **ethers**: Blockchain integration for treasury features
