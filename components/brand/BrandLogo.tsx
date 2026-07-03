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

function LogoMark({ className, gradientId }: { className?: string; gradientId: string }) {
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
          <stop stopColor="#8b5cf6" />
          <stop offset="0.5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path
        d="M9 22V10h4.2c2.4 0 3.9 1.3 3.9 3.2 0 1.4-.7 2.4-1.9 2.9l2.6 5.9h-2.5l-2.3-5.4H11.4V22H9zm2.4-7.4h1.7c1.1 0 1.7-.6 1.7-1.5s-.6-1.4-1.7-1.4h-1.7v2.9zM20.2 22l3.8-12h2.3L23.5 22h-3.3z"
        fill="white"
      />
    </svg>
  );
}

/** VidPulse logo mark with optional wordmark. Works in light and dark themes. */
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
        <LogoMark className="h-full w-full" gradientId={gradientId} />
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
