import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    flashcard: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    flashcardTag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
} from "@/actions/flashcards";

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db, true);

const SESSION = { user: { id: "user-1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION as never);
});

describe("createFlashcard", () => {
  it("creates a flashcard for the signed-in user", async () => {
    (mockDb.tag.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "tag-1" });
    (mockDb.flashcard.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "fc-1" });

    await createFlashcard({ question: "Q", answer: "A", context: "", tags: ["js"] });

    expect(mockDb.flashcard.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ question: "Q", answer: "A", userId: "user-1" }),
      })
    );
  });

  it("throws if not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    await expect(
      createFlashcard({ question: "Q", answer: "A", context: "", tags: [] })
    ).rejects.toThrow("Unauthorized");
  });

  it("throws if question is empty", async () => {
    await expect(
      createFlashcard({ question: "  ", answer: "A", context: "", tags: [] })
    ).rejects.toThrow("Question is required");
  });

  it("throws if answer is empty", async () => {
    await expect(
      createFlashcard({ question: "Q", answer: "  ", context: "", tags: [] })
    ).rejects.toThrow("Answer is required");
  });
});

describe("updateFlashcard", () => {
  it("updates a flashcard owned by the user", async () => {
    (mockDb.flashcard.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "fc-1", userId: "user-1" });
    (mockDb.tag.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "tag-1" });
    (mockDb.flashcardTag.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockDb.flashcardTag.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockDb.flashcard.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "fc-1" });

    await updateFlashcard("fc-1", { question: "Q2", answer: "A2", context: "", tags: [] });

    expect(mockDb.flashcard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "fc-1" },
        data: expect.objectContaining({ question: "Q2", answer: "A2" }),
      })
    );
  });

  it("throws if flashcard is not owned by user", async () => {
    (mockDb.flashcard.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(
      updateFlashcard("fc-other", { question: "Q", answer: "A", context: "", tags: [] })
    ).rejects.toThrow("Not found");
  });
});

describe("deleteFlashcard", () => {
  it("deletes a flashcard owned by the user", async () => {
    (mockDb.flashcard.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "fc-1", userId: "user-1" });
    (mockDb.flashcard.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "fc-1" });

    await deleteFlashcard("fc-1");

    expect(mockDb.flashcard.delete).toHaveBeenCalledWith({ where: { id: "fc-1" } });
  });

  it("throws if flashcard is not owned by user", async () => {
    (mockDb.flashcard.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(deleteFlashcard("fc-other")).rejects.toThrow("Not found");
  });
});
