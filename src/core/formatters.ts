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
export function formatLargeNumber(value: number): string {
  if (value < 1000) {
    // Round to 1 decimal place if not an integer, but only if > 0
    if (value === 0) return "0";
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1).replace(/\.0$/, "");
  }

  let exponent = Math.floor(Math.log10(value) / 3);
  let shortValue = value / Math.pow(1000, exponent);

  // Handle rounding into the next tier (e.g. 999,999 -> 1M instead of 1000K)
  if (parseFloat(shortValue.toFixed(2)) >= 1000) {
    exponent++;
    shortValue /= 1000;
  }

  const suffixes = ["", "K", "M", "B"];
  let suffix = "";
  if (exponent < suffixes.length) {
    suffix = suffixes[exponent];
  } else {
    // Calculate aa, ab, ac...
    const aaIndex = exponent - 4;
    const firstChar = String.fromCharCode(97 + Math.floor(aaIndex / 26));
    const secondChar = String.fromCharCode(97 + (aaIndex % 26));
    suffix = firstChar + secondChar;
  }

  // Format with up to 2 decimal places
  let formatted = shortValue.toFixed(2);

  // Remove trailing .00 or .x0
  if (formatted.indexOf(".") !== -1) {
    formatted = formatted.replace(/\.?0+$/, "");
  }

  return formatted + suffix;
}

/**
 * Formats a currency value with a dollar sign and large number formatting.
 */
export function formatCurrency(value: number): string {
  return "$" + formatLargeNumber(value);
}
