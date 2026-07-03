"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";

import { SparkrollMark } from "@/components/logo/SparkrollMark";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4", text: "text-sm" },
  md: { box: "h-9 w-9 rounded-xl", icon: "h-5 w-5", text: "text-base" },
  lg: { box: "h-11 w-11 rounded-xl", icon: "h-6 w-6", text: "text-lg" },
} as const;

export type BrandLogoProps = {
  /** Accessible label for the logo mark (brand name). */
  label: string;
  showText?: boolean;
  size?: keyof typeof sizeMap;
  textClassName?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/** Sparkroll logo mark with optional wordmark. Works in light and dark themes. */
export function BrandLogo({
  label,
  showText = true,
  size = "md",
  className,
  textClassName,
  ...props
}: BrandLogoProps) {
  const s = sizeMap[size];
  const gradientId = useId();
  const sparkId = useId();
  const glowId = useId();

  return (
    <div className={cn("inline-flex min-w-0 items-center gap-2", className)} {...props}>
      <span className={cn("relative shrink-0 overflow-hidden shadow-sm", s.box)}>
        <SparkrollMark
          className="h-full w-full"
          gradientId={gradientId}
          sparkId={sparkId}
          glowId={glowId}
        />
      </span>
      {showText ? (
        <span
          className={cn(
            "truncate font-semibold tracking-tight",
            s.text,
            "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent",
            textClassName
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
