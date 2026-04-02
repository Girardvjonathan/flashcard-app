import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getHistorySessions } from "@/lib/history";
import { HistoryList } from "@/components/history/history-list";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const session = await auth();
  const userId = session!.user!.id!;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const { sessions, total, totalPages } = await getHistorySessions(userId, page);

  if (page > 1 && sessions.length === 0) redirect("/history");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total} completed {total === 1 ? "session" : "sessions"}
        </p>
      </div>

      <HistoryList sessions={sessions} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/history?page=${page - 1}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/history?page=${page + 1}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
