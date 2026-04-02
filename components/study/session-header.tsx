"use client";

import { motion } from "framer-motion";

interface SessionHeaderProps {
  answered: number;
  total: number;
  correct: number;
}

export function SessionHeader({ answered, total, correct }: SessionHeaderProps) {
  const ratio = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const progress = total === 0 ? 0 : (answered / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <span className="text-foreground font-medium">{answered}</span>
          <span className="mx-1">/</span>
          <span>{total}</span>
          <span className="ml-1 text-muted-foreground">cards</span>
        </span>
        <motion.span
          key={correct}
          initial={{ scale: 1.2, color: "oklch(0.7 0.2 145)" }}
          animate={{ scale: 1, color: "oklch(0.65 0.15 145)" }}
          transition={{ duration: 0.4 }}
          className="font-medium tabular-nums"
        >
          {correct} correct
          {answered > 0 && (
            <span className="text-muted-foreground font-normal ml-1">({ratio}%)</span>
          )}
        </motion.span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
