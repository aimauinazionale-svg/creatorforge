import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

/** Consistent page title block for app feature routes. */
export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        action
          ? "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          : "space-y-2",
        className
      )}
    >
      <div className="space-y-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="text-pretty text-sm text-muted-foreground sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
