import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CollectionForm } from "@/components/collections/collection-form";

export default async function NewCollectionPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const tags = await db.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New collection</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Group flashcards by selecting matching tags.
        </p>
      </div>
      <CollectionForm existingTags={tags.map((t) => t.name)} />
    </div>
  );
}
