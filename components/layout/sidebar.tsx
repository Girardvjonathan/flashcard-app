"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, LayoutGrid, History, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/flashcards", label: "Flashcards", icon: BookOpen },
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/study/new", label: "Study", icon: GraduationCap, activePrefix: "/study" },
  { href: "/history", label: "History", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border/50 bg-sidebar min-h-screen px-3 py-6">
      <div className="mb-8 px-3">
        <span className="text-lg font-semibold tracking-tight text-foreground">🃏 Flashcards</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon, activePrefix }) => {
          const prefix = activePrefix ?? href;
          const isActive = pathname === href || pathname.startsWith(prefix + "/");
          return (
            <Link key={href} href={href} className="relative">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
