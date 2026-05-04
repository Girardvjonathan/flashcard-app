"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface FlashcardSearchProps {
  allTags: string[];
  currentQ: string;
  currentTags: string[];
}

export function FlashcardSearch({
  allTags,
  currentQ,
  currentTags,
}: FlashcardSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState(currentQ);

  useEffect(() => {
    setQuery(currentQ);
  }, [currentQ]);

  function push(q: string, tags: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    if (tags.length) params.set("tags", tags.join(","));
    else params.delete("tags");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(value, currentTags), 300);
  }

  function toggleTag(tag: string) {
    const next = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    push(currentQ, next);
  }

  function clearAll() {
    setQuery("");
    startTransition(() => router.push(pathname));
  }

  const hasFilters = query.length > 0 || currentTags.length > 0;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by question or answer…"
          className="pl-8"
        />
      </div>

      {allTags.length > 0 && (
        <Popover>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 min-w-[6.5rem]"
            )}
          >
            Tags
            {currentTags.length > 0 && (
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-[10px] font-medium rounded-sm"
              >
                {currentTags.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-50 shrink-0" />
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <Command>
              <CommandInput placeholder="Filter tags…" />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {allTags.map((tag) => (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={() => toggleTag(tag)}
                      data-checked={currentTags.includes(tag)}
                    >
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearAll}
          aria-label="Clear filters"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
