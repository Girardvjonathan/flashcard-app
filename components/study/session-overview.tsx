"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

interface AnswerWithCard {
  id: string;
  correct: boolean | null;
  note: string | null;
  flashcard: { question: string } | null;
}

interface SessionOverviewProps {
  collectionName: string;
  startedAt: Date;
  endedAt: Date;
  answers: AnswerWithCard[];
}

function formatDuration(start: Date, end: Date): string {
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function SessionOverview({
  collectionName,
  startedAt,
  endedAt,
  answers,
}: SessionOverviewProps) {
  const answered = answers.filter((a) => a.correct !== null);
  const correct = answers.filter((a) => a.correct === true).length;
  const total = answers.length;
  const notedAnswers = answers.filter((a) => a.note?.trim());

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Study session complete
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{collectionName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 text-center space-y-1">
          <Clock className="h-5 w-5 text-muted-foreground mx-auto" />
          <p className="text-xl font-semibold tabular-nums">
            {formatDuration(startedAt, endedAt)}
          </p>
          <p className="text-xs text-muted-foreground">Duration</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 text-center space-y-1">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
          <p className="text-xl font-semibold tabular-nums">
            {correct} / {total}
          </p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 text-center space-y-1">
          <BookOpen className="h-5 w-5 text-muted-foreground mx-auto" />
          <p className="text-xl font-semibold tabular-nums">{total}</p>
          <p className="text-xs text-muted-foreground">Cards</p>
        </div>
      </div>

      {/* Notes */}
      {notedAnswers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Notes
          </h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {notedAnswers.map((a) => (
              <motion.div
                key={a.id}
                variants={item}
                className="rounded-xl border border-border/50 bg-card p-4 space-y-2"
              >
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {a.flashcard?.question ?? "(deleted flashcard)"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.note}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-2">
        <Link href="/study/new" className={cn(buttonVariants(), "gap-2")}>
          New study session
        </Link>
        <Link href="/history" className={cn(buttonVariants({ variant: "ghost" }))}>
          View history
        </Link>
      </div>
    </div>
  );
}
