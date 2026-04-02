"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SessionHeader } from "./session-header";
import { FlashcardFlip } from "./flashcard-flip";
import { ReviewControls } from "./review-controls";
import { endStudySession } from "@/actions/study";

interface Card {
  answerId: string;
  flashcardId: string;
  question: string;
  answer: string;
  context: string | null;
}

interface StudySessionClientProps {
  sessionId: string;
  cards: Card[];
}

type View = "question" | "review";

export function StudySessionClient({ sessionId, cards }: StudySessionClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [view, setView] = useState<View>("question");
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [isEnding, startEndTransition] = useTransition();

  const total = cards.length;
  const current = cards[currentIndex];
  const isLast = currentIndex === total - 1;

  function handleFlipped(submitted: string) {
    setUserAnswer(submitted);
    setView("review");
  }

  function handleContinue(correct: boolean | null) {
    if (correct === true) setCorrectCount((c) => c + 1);

    if (isLast) {
      // Last card — end session and go to overview
      startEndTransition(async () => {
        await endStudySession(sessionId);
        router.push(`/study/${sessionId}/overview`);
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setView("question");
      setUserAnswer("");
    }
  }

  function handleEnd() {
    startEndTransition(async () => {
      await endStudySession(sessionId);
      router.push(`/study/${sessionId}/overview`);
    });
  }

  if (isEnding) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <SessionHeader
        answered={currentIndex}
        total={total}
        correct={correctCount}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="space-y-5"
        >
          <FlashcardFlip
            answerId={current.answerId}
            question={current.question}
            answer={current.answer}
            context={current.context}
            onFlipped={handleFlipped}
          />

          {view === "review" && (
            <ReviewControls
              answerId={current.answerId}
              userAnswer={userAnswer}
              isLast={isLast}
              onContinue={handleContinue}
              onEnd={handleEnd}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
