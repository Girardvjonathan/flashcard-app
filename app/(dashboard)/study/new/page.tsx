import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StartStudyButton } from "@/components/study/start-study-button";

export default async function NewStudySessionPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const collections = await db.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { collectionTags: { include: { tag: true } } },
  });

  // Count matching flashcards per collection, filter out empty ones
  const collectionsWithCount = (
    await Promise.all(
      collections.map(async (col) => {
        const tagNames = col.collectionTags.map((ct) => ct.tag.name);
        if (tagNames.length === 0) return null;
        const count = await db.flashcard.count({
          where: {
            userId,
            flashcardTags: { some: { tag: { name: { in: tagNames } } } },
          },
        });
        if (count === 0) return null;
        return { id: col.id, name: col.name, description: col.description, tagNames, count };
      })
    )
  ).filter(Boolean) as {
    id: string;
    name: string;
    description: string | null;
    tagNames: string[];
    count: number;
  }[];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Start study session</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pick a collection to study.
        </p>
      </div>

      {collectionsWithCount.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-border">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm font-medium text-foreground mb-1">No collections ready to study</p>
          <p className="text-sm text-muted-foreground">
            Create a collection with at least one matching flashcard to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {collectionsWithCount.map((col) => (
            <div
              key={col.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="space-y-1.5 min-w-0">
                <p className="font-medium text-foreground">{col.name}</p>
                {col.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{col.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    {col.count} {col.count === 1 ? "card" : "cards"}
                  </span>
                  {col.tagNames.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <StartStudyButton collectionId={col.id} className="shrink-0 gap-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
