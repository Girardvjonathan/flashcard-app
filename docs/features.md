# Flashcard Study App — PRD

## Overview

A web application for creating and studying flashcards. Users sign in via Google OAuth, organize flashcards with tags, group them into collections, and run self-graded study sessions.

**Stack:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, PostgreSQL

---

## Data Models

### User
- Authenticated via Google OAuth

### Flashcard
- `question` (text, required)
- `answer` (text, required)
- `context` (text, optional)
- `type`: `text` — other types (boolean, list) deferred to a future phase
- `tags` (0..many, from user's own tags)
- Belongs to one user

### User Tag
- User-defined label used to organize flashcards and collections
- Created inline when tagging a flashcard or collection (no dedicated management screen)

### Collection
- `name` (required)
- `description` (optional)
- `visibility`: `private` (default) | `public` — visibility field hidden in Phase 1 UI; all collections are private
- `tags` (0..many) — flashcards are auto-included if they match **any** of the collection's tags (union)
- Collections with zero matching flashcards are excluded from the study session picker
- *Future:* handpicked collections (not tag-driven)

### Study Session
- `started_at`, `ended_at`
- Belongs to one user and one collection
- Has many study answers
- Has many study notes

### Study Answer
- `flashcard_id`
- `answer` (text — user's free-text response)
- `correct` (boolean | nil — nil until user explicitly marks it)

### Study Note
- `text`
- Linked to a specific study answer (one note per card, added during the review step)
- Belongs to a study session

---

## Phase 1

### Auth
- Sign in / sign out via Google OAuth

### Flashcard Management
- Create a flashcard (question, answer, optional context, tags — created inline)
- Edit a flashcard
- Delete a flashcard
- List own flashcards

### Collection Management
- Create a collection (name, optional description, one or more tags)
- Edit / delete a collection
- Flashcards matching **any** selected tag are automatically included
- Collections with no matching flashcards are not available to start a session

### Study Session Flow

**Start**
- User picks one of their collections (only non-empty collections shown)
- Cards are drawn in **random order** from the pool of unanswered cards for that session

**Per-flashcard — Question view**
- Header: answered / total · correct ratio · remaining count
- Flashcard question
- Free-text answer input
- Submit button

**Per-flashcard — Review view**
- Same header
- Flashcard question + answer; "Show context" popup if context exists
- User's submitted answer (read-only)
- Mark correct / Mark incorrect buttons
- Optional note field (one note per card; saved to the session on Continue)
- Continue to next flashcard button
- End session button

**Session end** (triggered manually or after last card)
- Time elapsed
- Correct answer ratio
- All notes from the session (each note shown alongside its flashcard question)

---

## Phase 2

- View list of past study sessions
- View the full overview page for any past session (same layout as session-end screen)

---

## Out of Scope (v1)

- Study statistics and progress tracking over time
- AI-assisted answer validation / auto-scoring
- Resumable study sessions
- Browsing or selecting public collections
- Flashcard types other than `text` (boolean, list)
- Public collection visibility controls
  - flashcard soft delete for ongoing study session and public collection modification concurrency
- AI Tool to help create flashcard from study notes following principle from Ultralearning - Scott H Young
- filter on the flashcard page
- Better UX, add flashcard from a collection with autofilled tag
- Specifying study session max number of flashcard