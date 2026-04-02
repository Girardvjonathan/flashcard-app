import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const collection = await db.collection.findFirst({
    where: { id, userId },
    include: { collectionTags: { include: { tag: true } } },
  });

  if (!collection) notFound();

  const tagNames = collection.collectionTags.map((ct) => ct.tag.name);

  const flashcards =
    tagNames.length === 0
      ? []
      : await db.flashcard.findMany({
          where: {
            userId,
            flashcardTags: { some: { tag: { name: { in: tagNames } } } },
          },
          orderBy: { createdAt: "desc" },
          include: { flashcardTags: { include: { tag: true } } },
        });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagNames.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <Link
          href={`/collections/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 shrink-0")}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {flashcards.length} {flashcards.length === 1 ? "card" : "cards"}
        </p>

        {flashcards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              {tagNames.length === 0
                ? "Add tags to this collection to match flashcards."
                : "No flashcards match the selected tags yet."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Question</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap w-36">Created</th>
                </tr>
              </thead>
              <tbody>
                {flashcards.map((fc, i) => (
                  <tr
                    key={fc.id}
                    className={cn(
                      "border-b border-border/30 last:border-0",
                      i % 2 === 1 && "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3 text-foreground">{fc.question}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {fc.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
