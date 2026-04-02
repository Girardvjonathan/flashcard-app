"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronsUpDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  existingTags: string[];
  placeholder?: string;
  className?: string;
}

export function TagSelector({
  value,
  onChange,
  existingTags,
  placeholder = "Search or create tags…",
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const available = existingTags.filter((t) => !value.includes(t));
  const filtered = available.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );
  const canCreate =
    search.trim().length > 0 &&
    !existingTags.includes(search.trim().toLowerCase()) &&
    !value.includes(search.trim().toLowerCase());

  function selectTag(tag: string) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || value.includes(normalized)) return;
    onChange([...value, normalized]);
    setSearch("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text",
          "focus-within:ring-1 focus-within:ring-ring",
          open && "ring-1 ring-ring"
        )}
        onClick={() => setOpen(true)}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1 h-6 font-normal">
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeTag(tag);
              }}
              className="rounded-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="flex flex-1 items-center gap-1 min-w-[120px]">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          />
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <Command shouldFilter={false}>
            <CommandList className="max-h-48">
              {filtered.length === 0 && !canCreate ? (
                <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
                  {search ? "No matching tags." : "No tags yet."}
                </CommandEmpty>
              ) : null}

              {filtered.length > 0 ? (
                <CommandGroup heading="Existing tags">
                  {filtered.map((tag) => (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={() => selectTag(tag)}
                      className="cursor-pointer"
                    >
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              {canCreate ? (
                <CommandGroup heading="Create">
                  <CommandItem
                    value={`create:${search}`}
                    onSelect={() => selectTag(search)}
                    className="cursor-pointer gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create &quot;{search.trim().toLowerCase()}&quot;
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
