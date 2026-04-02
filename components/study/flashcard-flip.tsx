"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitAnswer } from "@/actions/study";

interface FlashcardFlipProps {
  answerId: string;
  question: string;
  answer: string;
  context: string | null;
  onFlipped: (userAnswer: string) => void;
}

export function FlashcardFlip({
  answerId,
  question,
  answer,
  context,
  onFlipped,
}: FlashcardFlipProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userAnswer.trim() || flipped) return;

    startTransition(async () => {
      await submitAnswer(answerId, userAnswer.trim());
      setFlipped(true);
      // Brief delay so the flip completes before parent transitions
      setTimeout(() => onFlipped(userAnswer.trim()), 650);
    });
  }

  return (
    <div className="perspective-1000 w-full">
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── Front: Question ── */}
        <div
          className="backface-hidden w-full rounded-2xl border border-border/50 bg-card p-8 space-y-6"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Question
          </div>
          <p className="text-xl font-medium text-foreground leading-relaxed">{question}</p>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer…"
              className="min-h-[100px] resize-none text-base"
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as never);
              }}
            />
            <Button
              type="submit"
              disabled={!userAnswer.trim() || isPending}
              className="w-full gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit answer
            </Button>
          </form>
        </div>

        {/* ── Back: Correct Answer ── */}
        <div
          className="absolute inset-0 w-full rounded-2xl border border-border/50 bg-card p-8 space-y-6"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Answer
          </div>
          <p className="text-xl font-medium text-foreground leading-relaxed">{answer}</p>

          {context && (
            <div>
              <button
                type="button"
                onClick={() => setShowContext((v) => !v)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                {showContext ? "Hide context" : "Show context"}
              </button>
              <AnimatePresence>
                {showContext && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                      {context}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
