import { db } from "@/lib/db";

const PAGE_SIZE = 10;

export interface HistorySession {
  id: string;
  collectionName: string;
  startedAt: Date;
  endedAt: Date;
  correctCount: number;
  totalCount: number;
}

export async function getHistorySessions(
  userId: string,
  page: number,
  pageSize = PAGE_SIZE
) {
  const skip = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    db.studySession.findMany({
      where: { userId, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        collection: { select: { name: true } },
        studyAnswers: { select: { correct: true } },
      },
    }),
    db.studySession.count({
      where: { userId, endedAt: { not: null } },
    }),
  ]);

  const sessions: HistorySession[] = rows.map((s) => ({
    id: s.id,
    collectionName: s.collection.name,
    startedAt: s.startedAt,
    endedAt: s.endedAt!,
    correctCount: s.studyAnswers.filter((a) => a.correct === true).length,
    totalCount: s.studyAnswers.length,
  }));

  return {
    sessions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
