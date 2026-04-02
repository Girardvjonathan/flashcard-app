import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CollectionForm } from "@/components/collections/collection-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const [collection, allTags] = await Promise.all([
    db.collection.findFirst({
      where: { id, userId },
      include: { collectionTags: { include: { tag: true } } },
    }),
    db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!collection) notFound();

  const data = {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    tags: collection.collectionTags.map((ct) => ct.tag.name),
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit collection</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update name, description, or tags.
        </p>
      </div>
      <CollectionForm collection={data} existingTags={allTags.map((t) => t.name)} />
    </div>
  );
}
