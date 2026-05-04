import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { FlashcardList } from "@/components/flashcards/flashcard-list";
import { FlashcardSearch } from "@/components/flashcards/flashcard-search";

interface Props {
  searchParams: Promise<{ q?: string; tags?: string }>;
}

export default async function FlashcardsPage({ searchParams }: Props) {
  const session = await auth();
  const userId = session!.user!.id!;

  const { q, tags: tagsParam } = await searchParams;
  const selectedTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const isFiltered = Boolean(q || selectedTags.length);

  const [flashcards, allTagRecords] = await Promise.all([
    db.flashcard.findMany({
      where: {
        userId,
        ...(q && {
          OR: [
            { question: { contains: q, mode: "insensitive" } },
            { answer: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(selectedTags.length > 0 && {
          AND: selectedTags.map((tag) => ({
            flashcardTags: { some: { tag: { name: tag } } },
          })),
        }),
      },
      orderBy: { createdAt: "desc" },
      include: { flashcardTags: { include: { tag: true } } },
    }),
    db.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  const data = flashcards.map((fc) => ({
    id: fc.id,
    question: fc.question,
    answer: fc.answer,
    tags: fc.flashcardTags.map((ft) => ft.tag.name),
  }));

  const allTags = allTagRecords.map((t) => t.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.length} {data.length === 1 ? "card" : "cards"}
            {isFiltered && " found"}
          </p>
        </div>
        <Link href="/flashcards/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="h-4 w-4" />
          New flashcard
        </Link>
      </div>
      <FlashcardSearch
        allTags={allTags}
        currentQ={q ?? ""}
        currentTags={selectedTags}
      />
      <FlashcardList flashcards={data} isFiltered={isFiltered} />
    </div>
  );
}
