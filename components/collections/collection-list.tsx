"use client";

import { motion } from "framer-motion";
import { CollectionCard } from "./collection-card";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  flashcardCount: number;
}

interface CollectionListProps {
  collections: Collection[];
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

export function CollectionList({ collections }: CollectionListProps) {
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📚</div>
        <p className="text-lg font-medium text-foreground mb-1">No collections yet</p>
        <p className="text-sm text-muted-foreground">Create a collection to group flashcards by topic.</p>
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
      {collections.map((col) => (
        <motion.div key={col.id} variants={item}>
          <CollectionCard {...col} />
        </motion.div>
      ))}
    </motion.div>
  );
}
