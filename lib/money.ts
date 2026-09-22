/**
 * Parses the price Eda types into Telegram as a plain reply.
 *
 * Turkish keyboards produce "1.850", "1850", "1.850,50" and people add "TL" or
 * "₺". Getting this wrong means charging 1.850 kuruş instead of 1850 lira, so
 * anything ambiguous is rejected rather than guessed.
 */
export function parsePriceToKurus(input: string): number | null {
  const cleaned = input
    .trim()
    .replace(/\s/g, "")
    .replace(/(tl|try|₺)$/i, "")
    .trim();

  if (!cleaned) return null;

  let normalized: string;

  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned)) {
    // 1.850 / 1.850,50 — dots are thousand separators
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+,\d{1,2}$/.test(cleaned)) {
    // 1850,50
    normalized = cleaned.replace(",", ".");
  } else if (/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    // 1850 / 1850.50 — a lone dot with 1-2 decimals is a decimal point
    normalized = cleaned;
  } else {
    return null;
  }

  const lira = Number(normalized);
  if (!Number.isFinite(lira) || lira <= 0 || lira > 1_000_000) return null;

  return Math.round(lira * 100);
}
