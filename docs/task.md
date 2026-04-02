# Implementation Plan
# Flashcard Study App

**Last updated:** 2026-04-02  
**Methodology:** TDD — write failing test first, then implementation.

---

## Dependency Order Overview

```
Phase 0: Project Setup
    └── Phase 1: Auth + Flashcard CRUD (Slice 1)
            └── Phase 2: Collections (Slice 2)
                    └── Phase 3: Study Sessions (Slice 3)
                            └── Phase 4: Session History (Slice 4)
```

---

## Phase 0 — Project Bootstrap

These tasks have no dependencies on each other and can be done in one sitting before any feature work.

---

### T-01 — Initialize Next.js project

**Depends on:** nothing

- `npx create-next-app@latest` with TypeScript, Tailwind, App Router, `src/` off
- Verify `next.config.ts` and `tsconfig.json` are sane
- Delete boilerplate (`app/page.tsx` content, `globals.css` resets)

---

### T-02 — Configure dark theme + shadcn/ui

**Depends on:** T-01

- Initialize shadcn/ui: `npx shadcn@latest init`
- Set theme to dark in `tailwind.config.ts` (`darkMode: 'class'`)
- Apply dark class on `<html>` in `app/layout.tsx`
- Install initial components: `button`, `card`, `input`, `textarea`, `dialog`, `badge`, `popover`, `separator`, `avatar`, `dropdown-menu`
- Define CSS variables for the premium dark palette (background, surface, border, accent)

---

### T-03 — Install and wire dependencies

**Depends on:** T-01

- `npm install framer-motion`
- `npm install next-auth@beta @auth/prisma-adapter`
- `npm install prisma @prisma/client`
- `npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- Create `vitest.config.ts` and `vitest.setup.ts`
- Add `test` script to `package.json`

---

### T-04 — Prisma schema + Supabase connection

**Depends on:** T-03

- Create `prisma/schema.prisma` with all models (see ERD in `docs/design.md`):
  - NextAuth tables: `User`, `Account`, `Session`
  - App tables: `Tag`, `Flashcard`, `FlashcardTag`, `Collection`, `CollectionTag`, `StudySession`, `StudyAnswer`
- Add `DATABASE_URL` (pooler, port 6543) and `DIRECT_URL` (direct, port 5432) to `.env.local`
- Configure `datasource` with `directUrl` for migrations
- Create `lib/db.ts` — Prisma client singleton (guard against hot-reload instantiation)
- Run `prisma migrate dev --name init`
- Create `.env.example` documenting all required vars

---

### T-05 — Middleware + route protection

**Depends on:** T-03

- Create `middleware.ts`
- Protect all routes under `/(dashboard)` — redirect to `/sign-in` if no session
- Allow `/sign-in` and `/api/auth/*` unauthenticated
- **Test:** `middleware.test.ts` — assert redirect behavior for unauthenticated vs authenticated requests

---

## Phase 1 — Auth + Flashcard CRUD (Slice 1)

---

### T-06 — NextAuth v5 configuration

**Depends on:** T-04

- Create `lib/auth.ts` — NextAuth config with Google provider and Prisma adapter
- Create `app/api/auth/[...nextauth]/route.ts`
- Add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` to `.env.example`
- **Test:** mock Google provider callback; assert session is created and user row is upserted

---

### T-07 — Sign-in page

**Depends on:** T-06

- `app/(auth)/sign-in/page.tsx` — centered card, "Sign in with Google" button
- Server Component — redirect to `/flashcards` if already signed in
- Dark premium styling; subtle animated gradient background
- **Test:** renders Google sign-in button; pressing it calls `signIn('google')`

---

### T-08 — Root redirect + dashboard layout

**Depends on:** T-06

- `app/page.tsx` — redirect to `/flashcards` (auth handled by middleware)
- `app/(dashboard)/layout.tsx` — sidebar + top nav
- `components/layout/sidebar.tsx` — nav links (Flashcards, Collections, History)
- `components/layout/user-menu.tsx` — avatar dropdown with sign-out
- Active link highlighting; Framer Motion slide-in for sidebar on mobile
- **Test:** layout renders nav links; user-menu shows signed-in user name

---

### T-09 — Tag input component

**Depends on:** T-02

- `components/tags/tag-input.tsx` — controlled Client Component
- Behavior: type a tag name → press `Enter` or `,` → tag chip appears; click `×` to remove
- Supports existing tags (passed as props) and creates new ones inline
- Keyboard accessible
- **Test:** adding a tag, removing a tag, duplicate prevention, Enter key behavior

---

### T-10 — Flashcard Server Actions

**Depends on:** T-04

- `actions/flashcards.ts`
  - `createFlashcard(data)` — validates input, creates flashcard + tag relations, revalidates `/flashcards`
  - `updateFlashcard(id, data)` — verifies ownership, updates fields and tag relations
  - `deleteFlashcard(id)` — verifies ownership, deletes (cascades to `flashcard_tags`)
- **Test (unit):** each action with mocked Prisma — happy path, ownership guard (another user's ID should throw), missing required fields

---

### T-11 — Flashcard form component

**Depends on:** T-09, T-10

- `components/flashcards/flashcard-form.tsx` — Client Component
- Fields: question, answer, context (collapsible), tag input
- Calls `createFlashcard` or `updateFlashcard` Server Action on submit
- Loading state on submit button; inline field error messages
- **Test:** renders all fields; submit calls the correct action; shows error on empty question/answer

---

### T-12 — Flashcard list + card component

**Depends on:** T-02

- `components/flashcards/flashcard-card.tsx` — shows question (truncated), tag badges, edit/delete actions
- `components/flashcards/flashcard-list.tsx` — Framer Motion `staggerChildren` entrance animation
- Delete triggers confirmation dialog before calling `deleteFlashcard`
- **Test:** card renders question and tags; delete dialog appears before action fires

---

### T-13 — Flashcard pages

**Depends on:** T-11, T-12

- `app/(dashboard)/flashcards/page.tsx` — Server Component; fetches user's flashcards via Prisma; renders `FlashcardList`
- `app/(dashboard)/flashcards/new/page.tsx` — renders `FlashcardForm` in create mode
- `app/(dashboard)/flashcards/[id]/edit/page.tsx` — fetches flashcard by id (ownership check), renders `FlashcardForm` in edit mode; 404 if not found or not owned
- **Test:** edit page returns 404 for a flashcard owned by another user

---

## Phase 2 — Collections (Slice 2)

---

### T-14 — Collection Server Actions

**Depends on:** T-04

- `actions/collections.ts`
  - `createCollection(data)` — creates collection + `collection_tags` rows
  - `updateCollection(id, data)` — ownership check, replaces tag relations
  - `deleteCollection(id)` — ownership check, deletes collection (does not touch flashcards)
- **Test:** same pattern as T-10 — happy path, ownership guard, tag replacement logic

---

### T-15 — Collection form component

**Depends on:** T-09, T-14

- `components/collections/collection-form.tsx` — name, description, tag input
- **Test:** submit calls the correct action; at least one tag required validation

---

### T-16 — Collection card + list component

**Depends on:** T-02

- `components/collections/collection-card.tsx` — name, description, flashcard count badge, edit/delete
- `components/collections/collection-list.tsx` — stagger animation
- **Test:** card renders name and count; count reflects union-matched flashcards

---

### T-17 — Collection pages

**Depends on:** T-15, T-16

- `app/(dashboard)/collections/page.tsx` — fetches collections with flashcard count (via Prisma query joining through tags)
- `app/(dashboard)/collections/new/page.tsx`
- `app/(dashboard)/collections/[id]/page.tsx` — detail page; lists matched flashcards; "Start session" button (hidden if count = 0)
- `app/(dashboard)/collections/[id]/edit/page.tsx` — ownership check
- **Test:** detail page does not show "Start session" when collection has no matching flashcards

---

## Phase 3 — Study Sessions (Slice 3)

---

### T-18 — Session Server Actions

**Depends on:** T-04

- `actions/sessions.ts`
  - `startSession(collectionId)` — ownership check; loads matching flashcards; shuffles order (Fisher-Yates); creates `StudySession` row; returns session id
  - `submitAnswer(sessionId, flashcardId, answer)` — ownership check; creates `StudyAnswer` with `correct: null`
  - `markAnswer(answerId, correct: boolean)` — ownership check; updates `correct` field
  - `saveNote(answerId, note: string)` — ownership check; updates `note` field
  - `endSession(sessionId)` — sets `endedAt = now()`
- **Test:** `startSession` rejects empty collection; shuffle produces all cards exactly once; `markAnswer` rejects foreign session

---

### T-19 — Session header component

**Depends on:** T-02

- `components/sessions/session-header.tsx` — answered/total, correct ratio, progress bar
- Animates ratio counter on update (Framer Motion `AnimatePresence` + number tween)
- **Test:** renders correct counts; ratio recalculates when `correct` prop changes

---

### T-20 — Question view component

**Depends on:** T-19

- `components/sessions/question-view.tsx` — Client Component
- Shows flashcard question, textarea for answer, submit button
- Disables submit when answer is empty; shows loading spinner on submit
- Framer Motion card entrance animation
- **Test:** submit is disabled on empty input; calls `submitAnswer` action on submit; loading state shown

---

### T-21 — Review view component

**Depends on:** T-19

- `components/sessions/review-view.tsx` — Client Component
- Shows question + correct answer, user's answer (read-only), mark correct/wrong buttons, note field, Continue + End session buttons
- "Show context" popover (rendered only if `context` is non-null)
- Mark correct/wrong buttons: optimistic update on click, then call `markAnswer`
- **Test:** mark-correct updates ratio optimistically; "Show context" button hidden when context is null; note field saved on Continue

---

### T-22 — Session overview component

**Depends on:** T-02

- `components/sessions/session-overview.tsx`
- Time elapsed, correct ratio, list of (flashcard question + note) pairs
- Framer Motion stagger for note rows
- **Test:** renders elapsed time correctly; only shows notes that were saved; ratio is correct/answered

---

### T-23 — Active session page

**Depends on:** T-20, T-21, T-22

- `app/(dashboard)/sessions/[id]/page.tsx` — Client Component (manages current card index and view state: `question | review | overview`)
- On load: fetches session + ordered flashcard list (stored order from `startSession`)
- Transitions between question → review → question using `AnimatePresence`
- Automatically transitions to overview after the last card
- **Test:** transitions from question to review on submit; transitions to overview after last card; End session button triggers `endSession` and redirects to overview

---

### T-24 — Session overview page

**Depends on:** T-22, T-18

- `app/(dashboard)/sessions/[id]/overview/page.tsx` — Server Component
- Fetches session + all answers with flashcard questions
- Renders `SessionOverview` component
- Ownership check; redirect if session not found

---

## Phase 4 — Session History (Slice 4)

---

### T-25 — History list page

**Depends on:** T-18

- `app/(dashboard)/history/page.tsx` — Server Component
- Fetches completed sessions (`endedAt IS NOT NULL`) for the user, newest first
- Shows: collection name, date, duration, correct ratio
- Paginated (server-side, cursor or offset)
- **Test:** only completed sessions appear; incomplete sessions (null `endedAt`) are excluded

---

### T-26 — History detail page

**Depends on:** T-22, T-25

- `app/(dashboard)/history/[id]/page.tsx` — Server Component
- Reuses `SessionOverview` component
- Ownership check; 404 if not found

---

## Task Summary Table

| Task | Description | Slice | Blocked by |
|---|---|---|---|
| T-01 | Initialize Next.js project | Setup | — |
| T-02 | Dark theme + shadcn/ui | Setup | T-01 |
| T-03 | Install dependencies | Setup | T-01 |
| T-04 | Prisma schema + Supabase | Setup | T-03 |
| T-05 | Middleware + auth guard | Setup | T-03 |
| T-06 | NextAuth v5 config | 1 | T-04 |
| T-07 | Sign-in page | 1 | T-06 |
| T-08 | Root redirect + dashboard layout | 1 | T-06 |
| T-09 | Tag input component | 1 | T-02 |
| T-10 | Flashcard Server Actions | 1 | T-04 |
| T-11 | Flashcard form component | 1 | T-09, T-10 |
| T-12 | Flashcard list + card component | 1 | T-02 |
| T-13 | Flashcard pages | 1 | T-11, T-12 |
| T-14 | Collection Server Actions | 2 | T-04 |
| T-15 | Collection form component | 2 | T-09, T-14 |
| T-16 | Collection card + list | 2 | T-02 |
| T-17 | Collection pages | 2 | T-15, T-16 |
| T-18 | Session Server Actions | 3 | T-04 |
| T-19 | Session header component | 3 | T-02 |
| T-20 | Question view component | 3 | T-19 |
| T-21 | Review view component | 3 | T-19 |
| T-22 | Session overview component | 3 | T-02 |
| T-23 | Active session page | 3 | T-20, T-21, T-22 |
| T-24 | Session overview page | 3 | T-22, T-18 |
| T-25 | History list page | 4 | T-18 |
| T-26 | History detail page | 4 | T-22, T-25 |

---

## Risks & Edge Cases

### Auth & Session

| Risk | Impact | Mitigation |
|---|---|---|
| NextAuth v5 is still beta — API may differ from v4 docs | Auth broken | Pin the exact beta version; read `authjs.dev` not v4 docs |
| `auth()` helper behaves differently in Server Components vs Route Handlers vs Middleware | Silent auth bypass | Test each context explicitly; use the session from `auth()` consistently, never trust client-passed user IDs |
| Google OAuth consent screen not configured for production domain | Login fails in prod | Add Vercel preview URL patterns to Google OAuth authorized origins early |

### Database & Prisma

| Risk | Impact | Mitigation |
|---|---|---|
| Supabase connection pooler (port 6543) incompatible with Prisma interactive transactions | Transaction errors | Use `DIRECT_URL` for transactions; pooler only for simple queries |
| Prisma client instantiated multiple times in Next.js dev hot-reload | "too many connections" error | Singleton pattern in `lib/db.ts` with `global.__prisma` guard |
| `flashcard_tags` rows not cleaned up when a tag is deleted | Orphaned join rows / FK errors | Set `onDelete: Cascade` on the relation in Prisma schema |
| Deleting a flashcard mid-session (another browser tab) leaves a dangling `flashcardId` in `study_answers` | FK constraint error | Set `onDelete: SetNull` on `study_answers.flashcardId`; handle null flashcard gracefully in session UI |

### Collections

| Risk | Impact | Mitigation |
|---|---|---|
| Flashcard count query (union match across tags) is N+1 if done naively | Slow collection list | Use a single Prisma query with `_count` or a raw SQL subquery |
| A collection's tag is deleted after the session starts | Session has stale card list | Cards are snapshotted at session start (`startSession` reads flashcards once); deletion does not affect in-progress sessions |

### Study Sessions

| Risk | Impact | Mitigation |
|---|---|---|
| User opens two tabs and starts the same session | Duplicate sessions | `startSession` is idempotent to the same collection; or show a warning if an incomplete session exists for that collection |
| User navigates away mid-session (closes tab, hits back) | Session stuck as incomplete (`endedAt = null`) | History page filters these out (`endedAt IS NOT NULL`). Acceptable in v1 — resumable sessions are out of scope |
| Fisher-Yates shuffle done server-side but card order not persisted | Refresh loses order; cards repeat or are skipped | Persist shuffled order: store an `order` integer on `StudyAnswer` rows created upfront by `startSession` |
| Optimistic UI for mark-correct desynchronizes if server action fails | Wrong ratio displayed | Roll back optimistic state on action error; show a toast |
| `submitAnswer` called twice for the same card (double-click) | Duplicate `StudyAnswer` rows | Add a unique constraint on `(sessionId, flashcardId)` in the schema |

### UI & Animations

| Risk | Impact | Mitigation |
|---|---|---|
| Framer Motion `AnimatePresence` requires a stable `key` on children | Cards don't animate out | Always key on `flashcard.id`, not array index |
| shadcn/ui components use Radix UI portals — Framer Motion exit animations may not fire | Dialog/popover closes instantly | Wrap Radix content in `AnimatePresence` with `forceMount` + CSS-driven exit |
| Heavy animations on low-end mobile degrade session UX | Frustrating study experience | Respect `prefers-reduced-motion`; disable enter/exit animations when set |

### Security

| Risk | Impact | Mitigation |
|---|---|---|
| Server Actions do not check ownership before mutating | Any user can delete/edit another user's data | Every action must call `auth()` and compare `userId` before any DB write — enforce in tests |
| `collectionId` passed from client to `startSession` | User starts session on another user's collection | Ownership check is the first line of every action |
