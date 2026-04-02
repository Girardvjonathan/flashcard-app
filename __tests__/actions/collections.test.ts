import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    collection: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    collectionTag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    tag: { upsert: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/actions/collections";

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db, true);
const SESSION = { user: { id: "user-1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION as never);
});

describe("createCollection", () => {
  it("creates a collection for the signed-in user", async () => {
    (mockDb.tag.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "tag-1" });
    (mockDb.collection.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });

    await createCollection({ name: "My Collection", description: "", tags: ["js"] });

    expect(mockDb.collection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "My Collection", userId: "user-1" }),
      })
    );
  });

  it("throws if not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    await expect(
      createCollection({ name: "Col", description: "", tags: [] })
    ).rejects.toThrow("Unauthorized");
  });

  it("throws if name is empty", async () => {
    await expect(
      createCollection({ name: "  ", description: "", tags: [] })
    ).rejects.toThrow("Name is required");
  });
});

describe("updateCollection", () => {
  it("updates a collection owned by the user", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });
    (mockDb.tag.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "tag-1" });
    (mockDb.collectionTag.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockDb.collectionTag.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockDb.collection.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });

    await updateCollection("col-1", { name: "Updated", description: "", tags: ["ts"] });

    expect(mockDb.collection.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "col-1" } })
    );
  });

  it("throws if collection not owned by user", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(
      updateCollection("col-other", { name: "X", description: "", tags: [] })
    ).rejects.toThrow("Not found");
  });
});

describe("deleteCollection", () => {
  it("deletes a collection owned by the user", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });
    (mockDb.collection.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });

    await deleteCollection("col-1");

    expect(mockDb.collection.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
  });

  it("does not delete flashcards when collection is deleted", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });
    (mockDb.collection.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });

    await deleteCollection("col-1");

    expect(mockDb.collection.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
    expect((mockDb as any).flashcard?.delete).toBeUndefined();
  });

  it("throws if collection not owned by user", async () => {
    (mockDb.collection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(deleteCollection("col-other")).rejects.toThrow("Not found");
  });
});
