"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";

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

/** Sparkroll mark: film-roll arcs with a central spark. */
function LogoMark({ className, gradientId, sparkId }: { className?: string; gradientId: string; sparkId: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.55" stopColor="#d946ef" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id={sparkId} x1="14" y1="8" x2="22" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" fill="none" />
      <path
        d="M16 7.5a8.5 8.5 0 0 1 0 17"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 24.5a8.5 8.5 0 0 1 0-17"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeOpacity="0.7"
        fill="none"
      />
      <circle cx="16" cy="16" r="2.75" fill={`url(#${sparkId})`} />
      <path
        d="M16 10.5v1.5M16 20v1.5M10.5 16h1.5M20 16h1.5M12.2 12.2l1.1 1.1M18.7 18.7l1.1 1.1M19.8 12.2l-1.1 1.1M13.3 18.7l-1.1 1.1"
        stroke="#fef9c3"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

  return (
    <div className={cn("inline-flex min-w-0 items-center gap-2", className)} {...props}>
      <span className={cn("relative shrink-0 overflow-hidden shadow-sm", s.box)}>
        <LogoMark className="h-full w-full" gradientId={gradientId} sparkId={sparkId} />
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
