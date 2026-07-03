import type { SVGProps } from "react";

type SparkrollMarkProps = SVGProps<SVGSVGElement> & {
  gradientId?: string;
  shineId?: string;
};

/** Sparkroll icon mark: rounded-square app icon with geometric S monogram. */
export function SparkrollMark({
  gradientId = "sr-bg",
  shineId = "sr-shine",
  className,
  ...props
}: SparkrollMarkProps) {
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
        <linearGradient id={gradientId} x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id={shineId} x1="8" y1="6" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <rect width="32" height="32" rx="8" fill={`url(#${shineId})`} />
      <path
        d="M21.2 11.2C21.2 8.7 18.7 7 16 7c-3.2 0-5.6 1.8-5.6 4.4 0 2.1 1.3 3.4 3.8 4l3.6.7c2.4.5 3.6 1.7 3.6 3.6 0 2.6-2.4 4.3-5.8 4.3-3.1 0-5.5-1.6-5.8-4.1"
        stroke="white"
        strokeWidth="2.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 16.8 19.8 14.2 19.8 19.4Z"
        fill="white"
        fillOpacity="0.92"
      />
    </svg>
  );
}
