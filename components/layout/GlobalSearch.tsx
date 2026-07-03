"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { globalSearchAction } from "@/app/actions/search";
import type { SearchResultItem } from "@/lib/actions/types/search";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function GlobalSearch({ className }: { className?: string }) {
  const t = useTranslations("search");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const debounceRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  React.useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const res = await globalSearchAction({ query: trimmed });
      if (res.ok) setResults(res.data.results);
      else setResults([]);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-xs", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("placeholder")}
          aria-label={t("aria")}
          className="h-9 rounded-full border-border/60 bg-muted/30 pl-8 transition-all duration-200 focus-visible:bg-background focus-visible:ring-violet-500/30"
        />
        {loading ? (
          <Loader2
            className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {open && query.trim().length >= 2 ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md">
          {results.length === 0 && !loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul role="listbox" aria-label={t("resultsAria")}>
              {results.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-3 py-2 hover:bg-accent"
                  >
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(`types.${item.type}`)}
                      {item.subtitle ? ` · ${item.subtitle}` : ""}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
