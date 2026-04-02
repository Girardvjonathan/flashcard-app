import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { CollectionList } from "@/components/collections/collection-list";

export default async function CollectionsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const collections = await db.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      collectionTags: { include: { tag: true } },
    },
  });

  // Count matching flashcards per collection
  const data = await Promise.all(
    collections.map(async (col) => {
      const tagNames = col.collectionTags.map((ct) => ct.tag.name);
      const flashcardCount = tagNames.length === 0 ? 0 : await db.flashcard.count({
        where: {
          userId,
          flashcardTags: { some: { tag: { name: { in: tagNames } } } },
        },
      });
      return {
        id: col.id,
        name: col.name,
        description: col.description,
        tags: tagNames,
        flashcardCount,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>
        <Link href="/collections/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="h-4 w-4" />
          New collection
        </Link>
      </div>
      <CollectionList collections={data} />
    </div>
  );
}
