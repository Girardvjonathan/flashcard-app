"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startStudySession } from "@/actions/study";

interface StartStudyButtonProps {
  collectionId: string;
  className?: string;
}

export function StartStudyButton({ collectionId, className }: StartStudyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const sessionId = await startStudySession(collectionId);
      router.push(`/study/${sessionId}`);
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      Start study session
    </Button>
  );
}
