# Product Requirements Document
# Flashcard Study App

**Last updated:** 2026-04-02  
**Status:** Draft

---

## 1. Product Overview

A personal web application for creating and studying flashcards. Users sign in with Google, organize flashcards using tags, group them into collections, and run self-graded study sessions with free-text answers they mark as correct or incorrect.

---

## 2. Goals & Non-Goals

### Goals
- Let a user build a personal flashcard library and organize it with tags
- Let a user group flashcards into collections and run focused study sessions
- Keep the experience simple: no AI scoring, no spaced-repetition algorithm in v1

### Non-Goals (v1)
- AI-assisted answer validation or auto-scoring
- Resumable study sessions
- Browsing or selecting other users' public collections
- Flashcard types other than free-text (boolean, list)
- Study statistics / progress tracking over time

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| UI | React, Tailwind CSS, shadcn/ui |
| Auth | NextAuth / Auth.js — Google OAuth provider |
| ORM | Prisma |
| Database | PostgreSQL |
| Deployment | Vercel |

---

## 4. Data Models

### User
| Field | Type | Notes |
|---|---|---|
| id | string | from NextAuth |
| email | string | |
| name | string | |
| image | string | avatar URL |

### Tag
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | string | unique per user |
| userId | FK → User | |

### Flashcard
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| question | text | required |
| answer | text | required |
| context | text | optional |
| type | enum | `TEXT` only in v1 |
| userId | FK → User | |
| tags | Tag[] | many-to-many |
| createdAt | datetime | |
| updatedAt | datetime | |

### Collection
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | string | required |
| description | text | optional |
| userId | FK → User | |
| tags | Tag[] | many-to-many — flashcards matched by union |
| createdAt | datetime | |

> A collection is considered **empty** when no flashcard belonging to the user matches any of the collection's tags. Empty collections are excluded from the session-start picker.

### StudySession
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| userId | FK → User | |
| collectionId | FK → Collection | |
| startedAt | datetime | |
| endedAt | datetime | nullable until session ends |

### StudyAnswer
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| sessionId | FK → StudySession | |
| flashcardId | FK → Flashcard | |
| answer | text | user's free-text response |
| correct | boolean? | nil until user marks it |
| note | text | optional; one note per card |

---

## 5. Incremental Delivery Plan

The project ships in four slices, each independently deployable and usable.

---

### Slice 1 — Foundation (Auth + Flashcard CRUD)

**Goal:** A user can sign in and manage their flashcard library.

#### Features
- Google OAuth sign-in / sign-out via NextAuth
- Protected routes — unauthenticated users redirected to sign-in
- **Flashcard list page** — paginated list of own flashcards; shows question, answer (truncated), tags
- **Create flashcard** — question (required), answer (required), context (optional), tags (inline creation: type a tag name, press Enter)
- **Edit flashcard** — all fields editable, including tags
- **Delete flashcard** — confirmation dialog before deletion

#### Out of scope for this slice
- Collections, study sessions

#### Acceptance Criteria
- [ ] User can sign in and is redirected to the flashcard list
- [ ] User can create a flashcard with at least a question and answer
- [ ] User can add new tags inline without a separate tag management screen
- [ ] User can edit any field of an existing flashcard
- [ ] User can delete a flashcard; it no longer appears in the list
- [ ] A user cannot see or modify another user's flashcards

---

### Slice 2 — Collections

**Goal:** A user can group flashcards into named collections via tags.

#### Features
- **Collection list page** — list of own collections; shows name, description, flashcard count
- **Create collection** — name (required), description (optional), one or more tags (inline)
- **Edit collection** — update name, description, tags
- **Delete collection** — confirmation dialog
- **Collection detail page** — shows all flashcards currently matched by the collection's tags (union match)
- Collections with no matched flashcards display an empty state (e.g. "No flashcards match these tags yet")

#### Out of scope for this slice
- Study sessions

#### Acceptance Criteria
- [ ] User can create a collection and assign tags to it
- [ ] Collection detail page lists all flashcards that share at least one tag with the collection
- [ ] Adding a new flashcard with a matching tag causes it to appear in the collection automatically
- [ ] Editing a collection's tags updates the flashcard list immediately
- [ ] Deleting a collection does not delete any flashcards

---

### Slice 3 — Study Sessions

**Goal:** A user can run a study session on a collection and track their answers.

#### Features

**Session start**
- "Start session" button on collection detail page (hidden if collection is empty)
- Cards drawn in random order from the full collection on session start

**Question view** (per card)
- Header: `{answered} / {total}` · correct ratio · remaining count
- Flashcard question
- Free-text answer input
- Submit button

**Review view** (per card, after submit)
- Same header
- Flashcard question + correct answer
- "Show context" button → modal/popover (only shown if context exists)
- User's submitted answer (read-only)
- Mark correct / Mark incorrect icon buttons
- Optional note text field (one note per card)
- "Continue" button → next card
- "End session" button → session overview

**Session overview** (after last card or manual end)
- Time elapsed
- Correct answer ratio (`{correct} / {answered}`)
- List of notes: each note shown alongside its flashcard question

#### Acceptance Criteria
- [ ] Only non-empty collections show a "Start session" button
- [ ] Cards are presented in random order; each card appears at most once per session
- [ ] User can submit a free-text answer and advance to the review view
- [ ] User can mark an answer correct or incorrect; the header ratio updates accordingly
- [ ] User can add a note to a card; the note is saved when continuing to the next card
- [ ] Ending a session early saves `endedAt` and shows the overview with only answered cards
- [ ] Finishing all cards automatically shows the session overview
- [ ] Session overview shows time elapsed, correct ratio, and all saved notes

---

### Slice 4 — Session History (Phase 2)

**Goal:** A user can review their past study sessions.

#### Features
- **History page** — paginated list of past sessions; shows collection name, date, duration, correct ratio
- **Session detail page** — full overview (same layout as post-session overview screen)

#### Acceptance Criteria
- [ ] History page lists all completed sessions for the signed-in user, newest first
- [ ] Each row links to the session detail page
- [ ] Session detail page shows time elapsed, correct ratio, and all notes with their flashcard questions

---

## 6. Page / Route Map

```
/                          → redirect to /flashcards (if signed in) or /sign-in
/sign-in                   → Google OAuth entry point
/flashcards                → Slice 1: flashcard list
/flashcards/new            → Slice 1: create flashcard
/flashcards/[id]/edit      → Slice 1: edit flashcard
/collections               → Slice 2: collection list
/collections/new           → Slice 2: create collection
/collections/[id]          → Slice 2: collection detail + "Start session"
/collections/[id]/edit     → Slice 2: edit collection
/sessions/[id]             → Slice 3: active study session (question + review views)
/sessions/[id]/overview    → Slice 3: session overview
/history                   → Slice 4: past sessions list
/history/[id]              → Slice 4: past session detail
```

---

## 7. Engineering Principles

- **Server Components by default** — use Client Components only where interactivity requires it (forms, modals, session UI)
- **Server Actions for mutations** — no separate API layer for CRUD; use Next.js Server Actions with Prisma
- **Optimistic UI** — mark/unmark correct buttons should feel instant
- **Mobile-responsive** — all pages usable on phone-sized screens
- **No public data in v1** — all data is scoped to the signed-in user; middleware enforces auth on all routes except `/sign-in`

---

## 8. Out of Scope (future phases)

| Feature | Notes |
|---|---|
| Flashcard types: boolean, list | UI changes required for answer input |
| Handpicked collections | Collections where cards are added manually, not by tag |
| Public collection browsing | All collections are private in v1 |
| Resumable sessions | Would require persisting in-progress session state |
| AI answer scoring | Auto-mark correct/incorrect using LLM |
| Study stats & progress | Retention curves, streak tracking, spaced repetition |
