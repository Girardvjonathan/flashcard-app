import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    studySession: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHistorySessions } from "@/lib/history";

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db, true);
const SESSION = { user: { id: "user-1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION as never);
});

const makeSession = (overrides = {}) => ({
  id: "s-1",
  startedAt: new Date("2026-01-01T10:00:00Z"),
  endedAt: new Date("2026-01-01T10:15:00Z"),
  collection: { name: "JS Basics" },
  studyAnswers: [
    { correct: true },
    { correct: false },
    { correct: true },
  ],
  ...overrides,
});

describe("getHistorySessions", () => {
  it("only returns completed sessions (endedAt not null)", async () => {
    (mockDb.studySession.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeSession(),
    ]);
    (mockDb.studySession.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await getHistorySessions("user-1", 1);

    expect(mockDb.studySession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          endedAt: { not: null },
        }),
      })
    );
    expect(result.sessions).toHaveLength(1);
  });

  it("computes correct ratio from studyAnswers", async () => {
    (mockDb.studySession.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeSession(),
    ]);
    (mockDb.studySession.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const { sessions } = await getHistorySessions("user-1", 1);

    expect(sessions[0].correctCount).toBe(2);
    expect(sessions[0].totalCount).toBe(3);
  });

  it("returns pagination metadata", async () => {
    (mockDb.studySession.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeSession(),
    ]);
    (mockDb.studySession.count as ReturnType<typeof vi.fn>).mockResolvedValue(25);

    const { total, totalPages } = await getHistorySessions("user-1", 1, 10);

    expect(total).toBe(25);
    expect(totalPages).toBe(3);
  });
});
