# Technical Design
# Flashcard Study App

**Last updated:** 2026-04-02

---

## 1. Tech Stack & Rationale

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server Components + Server Actions eliminate the need for a separate API layer. Deployed on Vercel with zero config. |
| Language | **TypeScript** | End-to-end type safety from DB (Prisma) to UI. |
| UI library | **shadcn/ui** | Unstyled, composable components. Owned in the codebase — easy to theme for the dark premium look. |
| Styling | **Tailwind CSS** | Utility-first, pairs naturally with shadcn/ui. |
| Animations | **Framer Motion** | Best-in-class React animation. Card flip, page transitions, stagger effects for premium feel. |
| Auth | **NextAuth / Auth.js v5** | First-party Next.js integration. Google OAuth in a few lines. Session management built in. |
| ORM | **Prisma** | Type-safe DB client, great migration tooling, auto-generates types from schema. |
| Database | **Supabase (PostgreSQL)** | Managed Postgres, generous free tier, connection pooling via PgBouncer for Vercel serverless. |
| Testing | **Vitest + React Testing Library** | Fast, native ESM, compatible with Next.js App Router. RTL for component tests. |
| Deployment | **Vercel** | Native Next.js platform. Preview deployments per PR, Edge Middleware support. |

---

## 2. Database Schema (ERD)

### Entity Relationship Diagram

```
┌─────────────────────┐
│        users        │  ← managed by NextAuth
├─────────────────────┤
│ id         TEXT  PK │
│ name       TEXT     │
│ email      TEXT  UQ │
│ emailVerified DATE  │
│ image      TEXT     │
└──────────┬──────────┘
           │ 1
           │
     ┌─────┼──────────────────────────────────┐
     │     │                                  │
     │ *   │                              *   │
┌────▼─────┴──────┐              ┌────────────▼───────┐
│      tags       │              │     flashcards      │
├─────────────────┤              ├────────────────────-┤
│ id       UUID PK│              │ id        UUID  PK  │
│ name     TEXT   │              │ question  TEXT      │
│ userId   FK→user│              │ answer    TEXT      │
│ createdAt DATE  │              │ context   TEXT?     │
│ UNIQUE(name,    │              │ type      ENUM(TEXT)│
│   userId)       │              │ userId    FK→user   │
└────┬────────────┘              │ createdAt DATE      │
     │                           │ updatedAt DATE      │
     │ *            *            └──────┬──────────────┘
     └──────────────┐                  │
                    │         *        │
          ┌─────────▼──────────────────▼──┐
          │       flashcard_tags           │
          ├───────────────────────────────┤
          │ flashcardId  FK→flashcards  PK│
          │ tagId        FK→tags        PK│
          └───────────────────────────────┘

┌─────────────────────┐
│     collections     │
├─────────────────────┤
│ id          UUID PK │
│ name        TEXT    │
│ description TEXT?   │
│ visibility  ENUM    │  ← PRIVATE only in v1
│ userId      FK→user │
│ createdAt   DATE    │
│ updatedAt   DATE    │
└──────────┬──────────┘
           │ *            *
           └───────────────┐
                           │
                 ┌─────────▼──────────────┐
                 │    collection_tags      │
                 ├────────────────────────┤
                 │ collectionId FK→coll PK│
                 │ tagId        FK→tags PK│
                 └────────────────────────┘

┌──────────────────────────┐
│      study_sessions      │
├──────────────────────────┤
│ id           UUID  PK    │
│ userId       FK→user     │
│ collectionId FK→coll     │
│ startedAt    DATETIME    │
│ endedAt      DATETIME?   │  ← null until ended
└──────────┬───────────────┘
           │ 1
           │ *
┌──────────▼───────────────┐
│      study_answers       │
├──────────────────────────┤
│ id          UUID  PK     │
│ sessionId   FK→session   │
│ flashcardId FK→flashcard │
│ answer      TEXT         │  ← user's free-text response
│ correct     BOOLEAN?     │  ← null until marked
│ note        TEXT?        │  ← one optional note per card
└──────────────────────────┘
```

### NextAuth Required Tables

NextAuth v5 requires these tables (generated via Prisma adapter):

```
accounts        → OAuth account links (provider, tokens)
sessions        → Active user sessions (sessionToken, expires)
verification_tokens → Email verification (not used in v1 — Google OAuth only)
```

### Key Design Decisions

- **`flashcard_tags`** (join table): a flashcard belongs to many tags; tags are shared across all of a user's flashcards and collections.
- **`collection_tags`** (join table): collection membership is derived at query time — any flashcard whose tags overlap with the collection's tags is included. No denormalized list is stored.
- **`study_answers.correct`** is nullable — `null` means "not yet marked", `true`/`false` means the user explicitly marked it. This distinguishes "skipped rating" from "marked wrong".
- **`study_answers.note`** is stored on the answer row (not a separate table) — one note per card is a hard constraint in v1.
- **`collections.visibility`** is modeled now so the column exists in the DB, but the UI hides it in v1.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  Server Components          Client Components           │
│  (read-only, no JS)         (Framer Motion, forms,      │
│                              session flow, tag input)   │
└──────────────┬──────────────────────┬───────────────────┘
               │ HTML / RSC stream    │ fetch / WS
               ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js on Vercel                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Middleware  │  │ App Router   │  │ Route Handler │ │
│  │ (auth check) │  │ (RSC + SA)   │  │ /api/auth/..  │ │
│  └──────────────┘  └──────┬───────┘  └───────┬───────┘ │
│                           │                  │         │
│                    Server Actions             │         │
│                    (mutations)                │         │
└───────────────────────────┬──────────────────┼─────────┘
                            │                  │
               ┌────────────▼──────┐  ┌────────▼────────┐
               │    Prisma ORM     │  │  NextAuth v5     │
               └────────────┬──────┘  └────────┬────────┘
                            │                  │
               ┌────────────▼──────┐  ┌────────▼────────┐
               │     Supabase      │  │  Google OAuth    │
               │    PostgreSQL     │  │   (external)     │
               └───────────────────┘  └─────────────────┘
```

### Request Flow

**Page load (read):**
1. Browser requests a route
2. Middleware checks NextAuth session — redirects to `/sign-in` if unauthenticated
3. Server Component fetches data directly via Prisma (no HTTP round-trip)
4. HTML streamed to browser; Client Components hydrate where needed

**Mutation (create / update / delete):**
1. User submits a form / clicks a button in a Client Component
2. Server Action is called directly (no fetch to an API route)
3. Server Action validates input, calls Prisma, revalidates the relevant path
4. Server Component re-renders with fresh data

**Auth:**
1. User clicks "Sign in with Google"
2. NextAuth route handler `/api/auth/[...nextauth]` initiates OAuth flow
3. Google redirects back with tokens; NextAuth creates a session and a DB record
4. Session cookie is set; middleware allows access to protected routes

---

## 4. File & Folder Structure

```
flashcard-app/
│
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   └── sign-in/
│   │       └── page.tsx              # Sign-in page (Google button)
│   │
│   ├── (dashboard)/                  # Protected route group
│   │   ├── layout.tsx                # Shared nav + sidebar
│   │   │
│   │   ├── flashcards/
│   │   │   ├── page.tsx              # Flashcard list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create flashcard form
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx      # Edit flashcard form
│   │   │
│   │   ├── collections/
│   │   │   ├── page.tsx              # Collection list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create collection form
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Collection detail + flashcard list
│   │   │       └── edit/
│   │   │           └── page.tsx      # Edit collection form
│   │   │
│   │   ├── sessions/
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Active session (question + review)
│   │   │       └── overview/
│   │   │           └── page.tsx      # Post-session overview
│   │   │
│   │   └── history/
│   │       ├── page.tsx              # Past sessions list
│   │       └── [id]/
│   │           └── page.tsx          # Past session detail
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth route handler
│   │
│   ├── layout.tsx                    # Root layout (fonts, ThemeProvider)
│   └── page.tsx                      # Root redirect → /flashcards
│
├── components/
│   ├── ui/                           # shadcn/ui generated components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── flashcards/
│   │   ├── flashcard-card.tsx        # Single flashcard display
│   │   ├── flashcard-form.tsx        # Create / edit form (Client)
│   │   └── flashcard-list.tsx        # Animated list container
│   │
│   ├── collections/
│   │   ├── collection-card.tsx
│   │   ├── collection-form.tsx       # Client
│   │   └── collection-list.tsx
│   │
│   ├── sessions/
│   │   ├── session-header.tsx        # Progress bar + stats
│   │   ├── question-view.tsx         # Question + answer input (Client)
│   │   ├── review-view.tsx           # Review + mark correct/wrong (Client)
│   │   └── session-overview.tsx      # End-of-session summary
│   │
│   ├── tags/
│   │   └── tag-input.tsx             # Inline tag creation (Client)
│   │
│   └── layout/
│       ├── sidebar.tsx
│       ├── nav.tsx
│       └── user-menu.tsx
│
├── actions/                          # Next.js Server Actions
│   ├── flashcards.ts                 # createFlashcard, updateFlashcard, deleteFlashcard
│   ├── collections.ts                # createCollection, updateCollection, deleteCollection
│   └── sessions.ts                   # startSession, submitAnswer, markAnswer, endSession
│
├── lib/
│   ├── auth.ts                       # NextAuth config (Google provider, Prisma adapter)
│   ├── db.ts                         # Prisma client singleton
│   └── utils.ts                      # cn(), formatDuration(), etc.
│
├── prisma/
│   ├── schema.prisma                 # Single source of truth for DB schema
│   └── migrations/                   # Auto-generated migration files
│
├── __tests__/                        # Vitest test suite
│   ├── actions/
│   │   ├── flashcards.test.ts
│   │   ├── collections.test.ts
│   │   └── sessions.test.ts
│   ├── components/
│   │   ├── flashcard-form.test.tsx
│   │   ├── tag-input.test.tsx
│   │   ├── question-view.test.tsx
│   │   └── review-view.test.tsx
│   └── lib/
│       └── utils.test.ts
│
├── middleware.ts                     # Auth enforcement on all (dashboard) routes
├── vitest.config.ts
├── vitest.setup.ts                   # RTL setup, global mocks
├── tailwind.config.ts
├── next.config.ts
├── .env.local                        # Local secrets (never committed)
├── .env.example                      # Documented required env vars
└── package.json
```

### Folder Rationale

| Folder | Reason |
|---|---|
| `app/(auth)/` | Route group — no shared layout with dashboard, no auth middleware applied |
| `app/(dashboard)/` | Route group — wraps all protected pages in a single layout check |
| `components/ui/` | shadcn/ui components live here; never edit manually |
| `components/{feature}/` | Feature-scoped components; co-located with their domain |
| `actions/` | All Server Actions in one place; easy to audit mutations |
| `lib/` | Singleton clients and pure utilities — no React, no Next.js imports |
| `__tests__/` | Mirrors `actions/` and `components/` structure for easy navigation |

---

## 5. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://...         # Supabase direct connection (migrations)
DIRECT_URL=postgresql://...           # Supabase direct URL for Prisma (no pooling)

# Auth
AUTH_SECRET=...                       # NextAuth secret (openssl rand -base64 32)
AUTH_GOOGLE_ID=...                    # Google OAuth client ID
AUTH_GOOGLE_SECRET=...                # Google OAuth client secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Supabase requires two URLs with Prisma: `DATABASE_URL` uses the pooler (port 6543) for runtime queries; `DIRECT_URL` uses the direct connection (port 5432) for `prisma migrate`.
