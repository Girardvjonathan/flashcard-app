"use client";

import { motion } from "framer-motion";
import { FlashcardCard } from "./flashcard-card";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

interface FlashcardListProps {
  flashcards: Flashcard[];
  isFiltered?: boolean;
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function FlashcardList({ flashcards, isFiltered = false }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">{isFiltered ? "🔍" : "🃏"}</div>
        <p className="text-lg font-medium text-foreground mb-1">
          {isFiltered ? "No flashcards match your search" : "No flashcards yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          {isFiltered
            ? "Try adjusting your search or clearing the filters."
            : "Create your first flashcard to get started."}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {flashcards.map((fc) => (
        <motion.div key={fc.id} variants={item}>
          <FlashcardCard {...fc} />
        </motion.div>
      ))}
    </motion.div>
  );
}
