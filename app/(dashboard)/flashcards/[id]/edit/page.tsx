import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FlashcardForm } from "@/components/flashcards/flashcard-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFlashcardPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const [flashcard, allTags] = await Promise.all([
    db.flashcard.findFirst({
      where: { id, userId },
      include: { flashcardTags: { include: { tag: true } } },
    }),
    db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!flashcard) notFound();

  const data = {
    id: flashcard.id,
    question: flashcard.question,
    answer: flashcard.answer,
    context: flashcard.context,
    tags: flashcard.flashcardTags.map((ft) => ft.tag.name),
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit flashcard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update question, answer, context, or tags.
        </p>
      </div>
      <FlashcardForm flashcard={data} existingTags={allTags.map((t) => t.name)} />
    </div>
  );
}
