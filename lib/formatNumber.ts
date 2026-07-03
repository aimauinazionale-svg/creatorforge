export type FormatNumberOptions = {
  compact?: boolean;
  maximumFractionDigits?: number;
};

export function formatNumber(value: number, opts?: FormatNumberOptions): string {
  if (!Number.isFinite(value)) return "—";

  const compact = opts?.compact ?? true;
  const maximumFractionDigits = opts?.maximumFractionDigits ?? (compact ? 1 : 0);

  return new Intl.NumberFormat(undefined, {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number, opts?: { maximumFractionDigits?: number }): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: opts?.maximumFractionDigits ?? 1,
  }).format(value / 100);
}

