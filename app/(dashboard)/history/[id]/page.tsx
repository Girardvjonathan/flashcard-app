import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { SessionOverview } from "@/components/study/session-overview";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HistoryDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const studySession = await db.studySession.findFirst({
    where: { id, userId, endedAt: { not: null } },
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
    <div className="space-y-6">
      <Link
        href="/history"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1 -ml-2 text-muted-foreground"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to history
      </Link>

      <SessionOverview
        collectionName={studySession.collection.name}
        startedAt={studySession.startedAt}
        endedAt={studySession.endedAt}
        answers={answers}
      />
    </div>
  );
}
