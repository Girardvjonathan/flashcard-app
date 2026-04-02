"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import type { HistorySession } from "@/lib/history";

interface HistoryListProps {
  sessions: HistorySession[];
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

function formatDuration(start: Date, end: Date): string {
  const seconds = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function HistoryList({ sessions }: HistoryListProps) {
  const router = useRouter();
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📖</div>
        <p className="text-lg font-medium text-foreground mb-1">No sessions yet</p>
        <p className="text-sm text-muted-foreground">
          Complete a study session to see it here.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="rounded-xl border border-border/50 overflow-hidden"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Collection</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Date</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell">Duration</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Score</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => {
            const ratio =
              s.totalCount === 0 ? "—" : `${s.correctCount} / ${s.totalCount}`;
            const pct =
              s.totalCount === 0
                ? null
                : Math.round((s.correctCount / s.totalCount) * 100);

            return (
              <motion.tr
                key={s.id}
                variants={item}
                onClick={() => router.push(`/history/${s.id}`)}
                className={`border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${
                  i % 2 === 1 ? "bg-muted/10" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-foreground">{s.collectionName}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(s.startedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(s.startedAt, s.endedAt)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        pct !== null && pct >= 70
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-foreground tabular-nums">{ratio}</span>
                    {pct !== null && (
                      <span className="text-muted-foreground">({pct}%)</span>
                    )}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
