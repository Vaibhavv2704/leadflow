"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Command, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <header className="app-header">
      <div className="page-width flex h-[76px] items-center justify-between gap-3">
        <Link
          className="flex items-center gap-2.5"
          href="/"
          aria-label="LeadFlow home"
        >
          <span className="logo-mark">
            <Command size={22} strokeWidth={2.5} />
          </span>
          <span className="text-xl font-semibold tracking-[-0.8px]">
            leadflow<span className="text-primary">.</span>
          </span>
          <span className="ml-5 hidden border-l border-border pl-5 text-xs text-muted-foreground sm:inline">
            Less admin. More relationships.
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground md:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Your sales workspace
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <Sun size={18} className="hidden dark:block" />
            <Moon size={18} className="dark:hidden" />
          </Button>
          <span className="hidden size-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[11px] font-semibold text-primary sm:flex">
            LF
          </span>
        </div>
      </div>
    </header>
  );
}
