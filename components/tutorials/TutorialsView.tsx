"use client";

import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";

import { TutorialCard } from "@/components/tutorials/TutorialCard";
import { Button } from "@/components/ui/button";
import {
  TUTORIAL_CATEGORIES,
  TUTORIALS,
  type TutorialCategoryId,
} from "@/lib/tutorials";
import { cn } from "@/lib/utils";

type FilterValue = "all" | TutorialCategoryId;

export function TutorialsView() {
  const t = useTranslations("tutorials");
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(
    () => (filter === "all" ? TUTORIALS : TUTORIALS.filter((item) => item.categoryId === filter)),
    [filter]
  );

  const filters: { value: FilterValue; label: string }[] = [
    { value: "all", label: t("allCategories") },
    ...TUTORIAL_CATEGORIES.map((id) => ({ value: id, label: t(`categories.${id}`) })),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 via-rose-500/20 to-pink-500/20 ring-1 ring-rose-500/30">
          <GraduationCap className="h-6 w-6 text-rose-500 dark:text-pink-400" aria-hidden="true" />
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
      </div>

      <div
        className="mt-10 flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label={t("filterAria")}
      >
        {filters.map((item) => (
          <Button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            variant={filter === item.value ? "default" : "outline"}
            size="sm"
            className={cn(
              filter === item.value &&
                "bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 text-white hover:from-orange-500 hover:via-rose-500 hover:to-pink-500"
            )}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tutorial) => (
          <TutorialCard key={tutorial.id} tutorial={tutorial} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}
    </div>
  );
}
