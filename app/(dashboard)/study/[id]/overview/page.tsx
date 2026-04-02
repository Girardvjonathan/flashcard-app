import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SessionOverview } from "@/components/study/session-overview";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudySessionOverviewPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const studySession = await db.studySession.findFirst({
    where: { id, userId },
    include: {
      collection: true,
      studyAnswers: {
        orderBy: { order: "asc" },
        include: { flashcard: { select: { question: true } } },
      },
    },
  });

  if (!studySession || !studySession.endedAt) notFound();

  const answers = studySession.studyAnswers.map((a) => ({
    id: a.id,
    correct: a.correct,
    note: a.note,
    flashcard: a.flashcard,
  }));

  return (
    <div className="py-4">
      <SessionOverview
        collectionName={studySession.collection.name}
        startedAt={studySession.startedAt}
        endedAt={studySession.endedAt}
        answers={answers}
      />
    </div>
  );
}
