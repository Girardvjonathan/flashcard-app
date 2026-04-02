"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagSelector } from "@/components/tags/tag-selector";
import { createFlashcard, updateFlashcard } from "@/actions/flashcards";

interface FlashcardFormProps {
  flashcard?: {
    id: string;
    question: string;
    answer: string;
    context: string | null;
    tags: string[];
  };
  existingTags?: string[];
}

export function FlashcardForm({ flashcard, existingTags = [] }: FlashcardFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [question, setQuestion] = useState(flashcard?.question ?? "");
  const [answer, setAnswer] = useState(flashcard?.answer ?? "");
  const [context, setContext] = useState(flashcard?.context ?? "");
  const [tags, setTags] = useState<string[]>(flashcard?.tags ?? []);
  const [showContext, setShowContext] = useState(!!flashcard?.context);
  const [errors, setErrors] = useState<{ question?: string; answer?: string; form?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!question.trim()) next.question = "Question is required";
    if (!answer.trim()) next.answer = "Answer is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        if (flashcard) {
          await updateFlashcard(flashcard.id, { question, answer, context, tags });
        } else {
          await createFlashcard({ question, answer, context, tags });
        }
        router.push("/flashcards");
        router.refresh();
      } catch (err) {
        setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="space-y-1.5">
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          placeholder="What is the capital of France?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[80px] resize-none"
          aria-invalid={!!errors.question}
        />
        {errors.question ? (
          <p className="text-sm text-destructive">{errors.question}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          placeholder="Paris"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[80px] resize-none"
          aria-invalid={!!errors.answer}
        />
        {errors.answer ? (
          <p className="text-sm text-destructive">{errors.answer}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setShowContext((v) => !v)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showContext ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Additional context {showContext ? "(hide)" : "(optional)"}
        </button>
        {showContext && (
          <Textarea
            id="context"
            placeholder="Extra notes, mnemonic, or explanation…"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagSelector value={tags} onChange={setTags} existingTags={existingTags} />
      </div>

      {errors.form ? (
        <p className="text-sm text-destructive">{errors.form}</p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {flashcard ? "Save changes" : "Create flashcard"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
