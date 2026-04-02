import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    collection: { findFirst: vi.fn() },
    flashcard: { findMany: vi.fn() },
    studySession: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    studyAnswer: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  startStudySession,
  submitAnswer,
  markAnswer,
  saveNote,
  endStudySession,
} from "@/actions/study";

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db, true);
const SESSION = { user: { id: "user-1" } };

const FLASHCARDS = [
  { id: "fc-1", question: "Q1", answer: "A1" },
  { id: "fc-2", question: "Q2", answer: "A2" },
  { id: "fc-3", question: "Q3", answer: "A3" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION as never);
});

// ─── startStudySession ────────────────────────────────────────────────────────

describe("startStudySession", () => {
  it("creates a session and answer rows for each flashcard", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      collectionTags: [{ tag: { name: "js" } }],
    });
    (mockDb.flashcard.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(FLASHCARDS);
    (mockDb.studySession.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "session-1",
    });

    const result = await startStudySession("col-1");

    expect(result).toBe("session-1");
    expect(mockDb.studySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collectionId: "col-1",
          userId: "user-1",
        }),
      })
    );
  });

  it("throws if collection not owned by user", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(startStudySession("col-other")).rejects.toThrow("Not found");
  });

  it("throws if collection has no matching flashcards", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      collectionTags: [{ tag: { name: "js" } }],
    });
    (mockDb.flashcard.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await expect(startStudySession("col-1")).rejects.toThrow("No flashcards");
  });

  it("throws if not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    await expect(startStudySession("col-1")).rejects.toThrow("Unauthorized");
  });

  it("shuffles all flashcards — each card appears exactly once", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      collectionTags: [{ tag: { name: "js" } }],
    });
    (mockDb.flashcard.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(FLASHCARDS);
    (mockDb.studySession.create as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }: { data: { studyAnswers: { create: { flashcardId: string; order: number }[] } } }) => {
        const ids = data.studyAnswers.create.map((a) => a.flashcardId);
        expect(ids).toHaveLength(3);
        expect(new Set(ids).size).toBe(3);
        return Promise.resolve({ id: "session-1" });
      }
    );

    await startStudySession("col-1");
  });
});

// ─── submitAnswer ────────────────────────────────────────────────────────────

describe("submitAnswer", () => {
  it("updates the study answer with the user's response", async () => {
    (mockDb.studyAnswer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ans-1",
      session: { userId: "user-1" },
    });
    (mockDb.studyAnswer.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await submitAnswer("ans-1", "my answer");

    expect(mockDb.studyAnswer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ans-1" },
        data: expect.objectContaining({ answer: "my answer" }),
      })
    );
  });

  it("throws if answer row not owned by user", async () => {
    (mockDb.studyAnswer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(submitAnswer("ans-other", "x")).rejects.toThrow("Not found");
  });
});

// ─── markAnswer ──────────────────────────────────────────────────────────────

describe("markAnswer", () => {
  it("marks an answer correct", async () => {
    (mockDb.studyAnswer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ans-1",
      session: { userId: "user-1" },
    });
    (mockDb.studyAnswer.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await markAnswer("ans-1", true);

    expect(mockDb.studyAnswer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { correct: true } })
    );
  });

  it("throws if answer row not owned by user", async () => {
    (mockDb.studyAnswer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(markAnswer("ans-other", true)).rejects.toThrow("Not found");
  });
});

// ─── saveNote ────────────────────────────────────────────────────────────────

describe("saveNote", () => {
  it("saves a note on an answer row", async () => {
    (mockDb.studyAnswer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ans-1",
      session: { userId: "user-1" },
    });
    (mockDb.studyAnswer.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await saveNote("ans-1", "remember this");

    expect(mockDb.studyAnswer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { note: "remember this" } })
    );
  });
});

// ─── endStudySession ─────────────────────────────────────────────────────────

describe("endStudySession", () => {
  it("sets endedAt on the session", async () => {
    (mockDb.studySession.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
    });
    (mockDb.studySession.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await endStudySession("session-1");

    expect(mockDb.studySession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session-1" },
        data: expect.objectContaining({ endedAt: expect.any(Date) }),
      })
    );
  });

  it("throws if session not owned by user", async () => {
    (mockDb.studySession.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(endStudySession("session-other")).rejects.toThrow("Not found");
  });
});
