/**
 * Turkish mobile numbers, normalised to 90XXXXXXXXXX.
 *
 * This matters more than e-mail validation did: a wrong address bounces, but a
 * wrong number fails silently — the WhatsApp link opens a chat with nobody and
 * the customer simply never hears back. So anything not clearly a Turkish
 * mobile is rejected rather than guessed at.
 */

/** Returns 90XXXXXXXXXX, or null when it is not a valid Turkish mobile. */
export function normalizeTrMobile(input: string): string | null {
  let d = input.replace(/\D/g, "");

  // 00 90 ... — international prefix written the old way
  if (d.startsWith("0090")) d = d.slice(2);
  // 90 5XX XXX XX XX
  if (d.length === 12 && d.startsWith("90")) d = d.slice(2);
  // 0 5XX XXX XX XX
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);

  // What is left must be a bare 10-digit mobile starting with 5.
  if (d.length !== 10 || !d.startsWith("5")) return null;
  return `90${d}`;
}

/** 905551112233 → 0555 111 22 33, for showing back to a human. */
export function formatTrMobile(e164: string): string {
  const d = e164.replace(/\D/g, "").replace(/^90/, "");
  if (d.length !== 10) return e164;
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

/** wa.me wants the number with no plus and no spaces. */
export function whatsappLink(e164: string, message: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
