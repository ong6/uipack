/* Pure helpers shared by the article parts. They are exported so a host that
   emits the same markup without React (a rehype plugin) formats dates and
   domains exactly as the components do. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-08-30" → "30 Aug 2026": day, short month, year, read as a calendar
 * date (no time zone), the way the notes site prints dates. Anything that is
 * not a valid ISO date is returned unchanged.
 */
export function formatNoteDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!m) return date;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > days) return date;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/**
 * The host name an absolute http(s) link points to, without "www.":
 * "https://www.anthropic.com/engineering/x" → "anthropic.com". Relative,
 * hash, mailto and malformed links have no domain (undefined).
 */
export function linkDomain(href: string): string | undefined {
  if (!/^https?:\/\//i.test(href.trim())) return undefined;
  try {
    return new URL(href.trim()).hostname.replace(/^www\./, "") || undefined;
  } catch {
    return undefined;
  }
}

/** 8 → "08"; strings pass through ("8a" stays "8a"). */
export const layerIndex = (index: number | string) =>
  typeof index === "number" ? String(index).padStart(2, "0") : index;

/** Joins class names, skipping empty ones. */
export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

export const fail = (part: string, message: string): never => {
  throw new Error(`${part}: ${message}`);
};
