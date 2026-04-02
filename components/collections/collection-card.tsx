"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteCollection } from "@/actions/collections";

interface CollectionCardProps {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  flashcardCount: number;
}

export function CollectionCard({ id, name, description, tags, flashcardCount }: CollectionCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteCollection(id);
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <div className="group relative rounded-xl border border-border/50 bg-card p-5 hover:border-border transition-colors">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/collections/${id}`} className="flex-1 min-w-0 space-y-2 hover:opacity-80 transition-opacity">
            <p className="font-medium text-foreground leading-snug line-clamp-1">{name}</p>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                {flashcardCount} {flashcardCount === 1 ? "card" : "cards"}
              </span>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Link>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Link
              href={`/collections/${id}/edit`}
              aria-label="Edit collection"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete collection"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete collection?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{name}&quot;. Flashcards will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
