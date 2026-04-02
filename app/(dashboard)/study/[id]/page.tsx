import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StudySessionClient } from "@/components/study/study-session-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudySessionPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const studySession = await db.studySession.findFirst({
    where: { id, userId },
    include: {
      studyAnswers: {
        orderBy: { order: "asc" },
        include: { flashcard: true },
      },
    },
  });

  if (!studySession) notFound();

  // If session already ended, redirect to overview
  if (studySession.endedAt) {
    redirect(`/study/${id}/overview`);
  }

  const cards = studySession.studyAnswers
    .filter((a) => a.flashcard !== null)
    .map((a) => ({
      answerId: a.id,
      flashcardId: a.flashcard!.id,
      question: a.flashcard!.question,
      answer: a.flashcard!.answer,
      context: a.flashcard!.context,
    }));

  if (cards.length === 0) notFound();

  return (
    <div className="py-4">
      <StudySessionClient sessionId={id} cards={cards} />
    </div>
  );
}
