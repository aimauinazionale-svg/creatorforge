import type { SVGProps } from "react";

import {
  SPARKROLL_BRAND,
  SPARKROLL_MARK_PATH_24,
  SPARKROLL_MARK_PATH_32,
} from "@/components/logo/sparkroll-mark-paths";

type SparkrollMarkProps = SVGProps<SVGSVGElement> & {
  gradientId?: string;
  /** Rounded-square navy tile (app icon). False = transparent mark only. */
  showBackground?: boolean;
};

/** Sparkroll S mark — interlocking swoosh monogram with orange→magenta gradient. */
export function SparkrollMark({
  gradientId = "sr-mark",
  showBackground = true,
  className,
  ...props
}: SparkrollMarkProps) {
  if (showBackground) {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop stopColor={SPARKROLL_BRAND.orange} />
            <stop offset="0.45" stopColor={SPARKROLL_BRAND.red} />
            <stop offset="1" stopColor={SPARKROLL_BRAND.magenta} />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="7" fill={SPARKROLL_BRAND.bg} />
        <path
          d={SPARKROLL_MARK_PATH_32}
          fill={`url(#${gradientId})`}
          fillRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={SPARKROLL_BRAND.orange} />
          <stop offset="0.45" stopColor={SPARKROLL_BRAND.red} />
          <stop offset="1" stopColor={SPARKROLL_BRAND.magenta} />
        </linearGradient>
      </defs>
      <path
        d={SPARKROLL_MARK_PATH_24}
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
      />
    </svg>
  );
}
