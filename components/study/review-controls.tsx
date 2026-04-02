"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { markAnswer, saveNote } from "@/actions/study";

interface ReviewControlsProps {
  answerId: string;
  userAnswer: string;
  isLast: boolean;
  /** Called after note is saved; parent handles advancing or ending. */
  onContinue: (correct: boolean | null) => void;
  /** Called after note is saved; parent handles endStudySession + redirect. */
  onEnd: () => void;
}

export function ReviewControls({
  answerId,
  userAnswer,
  isLast,
  onContinue,
  onEnd,
}: ReviewControlsProps) {
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleMark(value: boolean) {
    const next = correct === value ? null : value;
    setCorrect(next);
    startTransition(async () => {
      await markAnswer(answerId, next ?? false);
    });
  }

  function handleContinue() {
    startTransition(async () => {
      await saveNote(answerId, note);
      onContinue(correct);
    });
  }

  function handleEnd() {
    startTransition(async () => {
      await saveNote(answerId, note);
      onEnd();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-5"
    >
      {/* User's submitted answer */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Your answer
        </p>
        <p className="text-sm text-foreground leading-relaxed">{userAnswer}</p>
      </div>

      {/* Mark correct / incorrect */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleMark(true)}
          disabled={isPending}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all",
            correct === true
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-border/50 text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-400"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Correct
        </button>
        <button
          type="button"
          onClick={() => handleMark(false)}
          disabled={isPending}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all",
            correct === false
              ? "border-rose-500 bg-rose-500/10 text-rose-400"
              : "border-border/50 text-muted-foreground hover:border-rose-500/50 hover:text-rose-400"
          )}
        >
          <XCircle className="h-4 w-4" />
          Incorrect
        </button>
      </div>

      {/* Note */}
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)…"
        className="min-h-[72px] resize-none text-sm"
        disabled={isPending}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleContinue} disabled={isPending} className="flex-1 gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {isLast ? "Finish" : "Continue"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleEnd}
          disabled={isPending}
          className="gap-2 text-muted-foreground"
        >
          <StopCircle className="h-4 w-4" />
          End session
        </Button>
      </div>
    </motion.div>
  );
}
