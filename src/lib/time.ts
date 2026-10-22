/**
 * Timezone helpers.
 *
 * The LMS is operated from Indonesia, so every wall-clock value the user types
 * or reads is WIB (Asia/Jakarta, UTC+7) — independent of the server's own
 * timezone (UTC on Vercel, anything on a dev machine). Storing a naive
 * "2026-11-01T10:00" string makes Postgres read it as UTC, which shifts every
 * schedule by 7 hours; all writes therefore go through `wibInputToIso`.
 */

export const WIB_TZ = "Asia/Jakarta";
const WIB_OFFSET = "+07:00";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WIB_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export type WibParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Wall-clock components of an instant, expressed in WIB. */
export function wibParts(value: string | Date | null | undefined): WibParts | null {
  const d = toDate(value);
  if (!d) return null;
  const parts = partsFormatter.formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** `2026-11-01T10:00` (as typed in a WIB datetime-local input) → UTC ISO string. */
export function wibInputToIso(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  // already carries an offset or a Z → respect it
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  // datetime-local may omit seconds
  const normalised = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) ? `${raw}:00` : raw;
  const d = new Date(`${normalised}${WIB_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** UTC ISO string → `2026-11-01T10:00` for a datetime-local input, in WIB. */
export function isoToWibInput(value: string | Date | null | undefined): string {
  const p = wibParts(value);
  if (!p) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** `YYYY-MM-DD` for the WIB calendar day of an instant. */
export function wibDateKey(value: string | Date | null | undefined): string {
  const p = wibParts(value);
  if (!p) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** UTC instant for a WIB wall-clock date (midnight by default). */
export function wibDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${WIB_OFFSET}`
  );
}

/** Day of week (0 = Sunday) for a WIB calendar date. */
export function wibWeekday(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Number of days in a month (WIB calendar). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
