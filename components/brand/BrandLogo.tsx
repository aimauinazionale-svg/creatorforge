"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";

import { SparkrollMark } from "@/components/logo/SparkrollMark";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { box: "h-8 w-8 rounded-lg", text: "text-sm" },
  md: { box: "h-9 w-9 rounded-xl", text: "text-base" },
  lg: { box: "h-11 w-11 rounded-xl", text: "text-lg" },
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

  return (
    <div className={cn("inline-flex min-w-0 items-center gap-2", className)} {...props}>
      <span className={cn("relative shrink-0 overflow-hidden shadow-sm", s.box)}>
        <SparkrollMark
          className="h-full w-full"
          gradientId={gradientId}
          showBackground
        />
      </span>
      {showText ? (
        <span
          className={cn(
            "truncate font-semibold tracking-tight",
            s.text,
            "bg-gradient-to-r from-[#FF7426] via-[#FF5830] to-[#FF1172] bg-clip-text text-transparent",
            textClassName
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
