import { FlashcardForm } from "@/components/flashcards/flashcard-form";

export default function NewFlashcardPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New flashcard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a question, answer, and optional tags.
        </p>
      </div>
      <FlashcardForm />
    </div>
  );
}
