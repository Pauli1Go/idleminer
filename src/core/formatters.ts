/**
 * Formats a number into a human-readable string with suffixes (K, M, B, aa, ab, etc.).
 *
 * Rules:
 * - < 1000: Standard number (e.g., 999)
 * - 1,000 - 999,999: K (e.g., 1.2K)
 * - 1,000,000 - 999,999,999: M (e.g., 1.5M)
 * - 1,000,000,000 - 999,999,999,999: B (e.g., 2.3B)
 * - 1,000,000,000,000+: aa, ab, ac... (e.g., 3.8aa)
 */
const DEFAULT_SIGNIFICANT_DIGITS = 3;
const LARGE_NUMBER_SUFFIXES = ["", "K", "M", "B"];

export function formatSignificantNumber(value: number, significantDigits = DEFAULT_SIGNIFICANT_DIGITS): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  if (value === 0) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const roundedValue = roundToSignificantDigits(Math.abs(value), significantDigits);
  return sign + trimTrailingZeros(formatWithFixedPrecision(roundedValue, significantDigits));
}

export function formatLargeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  if (value === 0) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);
  const roundedSmallValue = roundToSignificantDigits(absoluteValue);

  if (roundedSmallValue < 1000) {
    return sign + trimTrailingZeros(formatWithFixedPrecision(roundedSmallValue, DEFAULT_SIGNIFICANT_DIGITS));
  }

  let exponent = Math.floor(Math.log10(absoluteValue) / 3);
  let shortValue = absoluteValue / Math.pow(1000, exponent);
  shortValue = roundToSignificantDigits(shortValue);

  // Handle rounding into the next tier (e.g. 999,500 -> 1M instead of 1000K)
  if (shortValue >= 1000) {
    exponent++;
    shortValue /= 1000;
    shortValue = roundToSignificantDigits(shortValue);
  }

  let suffix = "";
  if (exponent < LARGE_NUMBER_SUFFIXES.length) {
    suffix = LARGE_NUMBER_SUFFIXES[exponent];
  } else {
    // Calculate aa, ab, ac...
    const aaIndex = exponent - LARGE_NUMBER_SUFFIXES.length;
    const firstChar = String.fromCharCode(97 + Math.floor(aaIndex / 26));
    const secondChar = String.fromCharCode(97 + (aaIndex % 26));
    suffix = firstChar + secondChar;
  }

  return sign + trimTrailingZeros(formatWithFixedPrecision(shortValue, DEFAULT_SIGNIFICANT_DIGITS)) + suffix;
}

/**
 * Formats a currency value with a dollar sign and large number formatting.
 */
export function formatCurrency(value: number): string {
  return value < 0 ? `-$${formatLargeNumber(Math.abs(value))}` : `$${formatLargeNumber(value)}`;
}

/**
 * Formats a duration as HHh MMm SSs.
 */
export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function roundToSignificantDigits(value: number, significantDigits = DEFAULT_SIGNIFICANT_DIGITS): number {
  if (value === 0) {
    return 0;
  }

  const decimalPlaces = getDecimalPlacesForSignificantDigits(value, significantDigits);
  return Number(value.toFixed(decimalPlaces));
}

function formatWithFixedPrecision(value: number, significantDigits = DEFAULT_SIGNIFICANT_DIGITS): string {
  const decimalPlaces = getDecimalPlacesForSignificantDigits(value, significantDigits);
  return value.toFixed(decimalPlaces);
}

function getDecimalPlacesForSignificantDigits(value: number, significantDigits: number): number {
  if (value === 0) {
    return 0;
  }

  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  return Math.max(0, significantDigits - magnitude - 1);
}

function trimTrailingZeros(value: string): string {
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}
