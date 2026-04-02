import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { FlashcardList } from "@/components/flashcards/flashcard-list";

export default async function FlashcardsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const flashcards = await db.flashcard.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      flashcardTags: {
        include: { tag: true },
      },
    },
  });

  const data = flashcards.map((fc) => ({
    id: fc.id,
    question: fc.question,
    answer: fc.answer,
    tags: fc.flashcardTags.map((ft) => ft.tag.name),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {flashcards.length} {flashcards.length === 1 ? "card" : "cards"}
          </p>
        </div>
        <Link href="/flashcards/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="h-4 w-4" />
          New flashcard
        </Link>
      </div>
      <FlashcardList flashcards={data} />
    </div>
  );
}
