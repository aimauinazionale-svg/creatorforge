import type { SVGProps } from "react";

type SparkrollMarkProps = SVGProps<SVGSVGElement> & {
  gradientId?: string;
  sparkId?: string;
  glowId?: string;
};

/** Sparkroll icon mark: film-strip sprockets + rolling waves + lightning spark. */
export function SparkrollMark({
  gradientId = "sr-bg",
  sparkId = "sr-spark",
  glowId = "sr-glow",
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
        <linearGradient id={gradientId} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={sparkId} x1="12" y1="7" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7ed" />
          <stop offset="0.45" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <rect
        x="5"
        y="7"
        width="22"
        height="18"
        rx="2"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="0.75"
        fill="none"
      />
      <rect x="6.25" y="8.25" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.55" />
      <rect x="6.25" y="11.5" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.45" />
      <rect x="6.25" y="14.75" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.45" />
      <rect x="6.25" y="18" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.45" />
      <rect x="6.25" y="21.25" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.55" />
      <rect x="24.25" y="8.25" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.55" />
      <rect x="24.25" y="11.5" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.45" />
      <rect x="24.25" y="14.75" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.45" />
      <rect x="24.25" y="18" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.45" />
      <rect x="24.25" y="21.25" width="1.5" height="1.5" rx="0.35" fill="white" fillOpacity="0.55" />
      <path
        d="M9 12.5c2.2-1.4 4.4-1.4 6.6 0s4.4 1.4 6.6 0"
        stroke="white"
        strokeWidth="1.35"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.85"
      />
      <path
        d="M9 19.5c2.2-1.4 4.4-1.4 6.6 0s4.4 1.4 6.6 0"
        stroke="white"
        strokeWidth="1.35"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.55"
      />
      <path
        d="M16 9.5 13.2 16h2.4L14.8 22.5 19.2 15h-2.3L16 9.5Z"
        fill={`url(#${sparkId})`}
        filter={`url(#${glowId})`}
      />
      <path
        d="M16 9.5 13.2 16h2.4L14.8 22.5 19.2 15h-2.3L16 9.5Z"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="0.4"
        fill="none"
      />
    </svg>
  );
}
