"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagSelector } from "@/components/tags/tag-selector";
import { createCollection, updateCollection } from "@/actions/collections";

interface CollectionFormProps {
  collection?: {
    id: string;
    name: string;
    description: string | null;
    tags: string[];
  };
  existingTags?: string[];
}

export function CollectionForm({ collection, existingTags = [] }: CollectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [tags, setTags] = useState<string[]>(collection?.tags ?? []);
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        if (collection) {
          await updateCollection(collection.id, { name, description, tags });
          router.push(`/collections/${collection.id}`);
        } else {
          await createCollection({ name, description, tags });
          router.push("/collections");
        }
        router.refresh();
      } catch (err) {
        setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="JavaScript Fundamentals"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          id="description"
          placeholder="A collection of core JS concepts…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <p className="text-xs text-muted-foreground">
          Flashcards matching any of these tags will appear in this collection.
        </p>
        <TagSelector value={tags} onChange={setTags} existingTags={existingTags} />
      </div>

      {errors.form ? (
        <p className="text-sm text-destructive">{errors.form}</p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {collection ? "Save changes" : "Create collection"}
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
