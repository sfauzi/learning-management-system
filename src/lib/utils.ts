import { toDate, wibParts } from "@/lib/time";

export { toDate, isoToWibInput, wibInputToIso, wibDateKey, wibParts } from "@/lib/time";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function months(locale = "id") {
  return locale === "id" ? MONTHS_ID : MONTHS_EN;
}
export function days(locale = "id") {
  return locale === "id" ? DAYS_ID : DAYS_EN;
}

/** Dates are always rendered in WIB, whatever the server timezone is. */
export function formatDate(
  value: string | Date | null | undefined,
  opts: { locale?: string; withYear?: boolean; short?: boolean } = {}
) {
  const p = wibParts(value);
  if (!p) return "—";
  const locale = opts.locale ?? "id";
  const month = months(locale)[p.month - 1];
  const label = opts.short ? month.slice(0, 3) : month;
  return `${p.day} ${label}${opts.withYear === false ? "" : ` ${p.year}`}`;
}

export function formatDateTime(
  value: string | Date | null | undefined,
  locale = "id",
  opts: { withZone?: boolean } = {}
) {
  const p = wibParts(value);
  if (!p) return "—";
  const hh = String(p.hour).padStart(2, "0");
  const mm = String(p.minute).padStart(2, "0");
  return `${formatDate(value, { locale })} · ${hh}:${mm}${opts.withZone ? " WIB" : ""}`;
}

export function formatTime(value: string | Date | null | undefined) {
  const p = wibParts(value);
  if (!p) return "—";
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export function timeAgo(value: string | Date | null | undefined, locale = "id") {
  const d = toDate(value);
  if (!d) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return locale === "id" ? "baru saja" : "just now";
  if (Math.abs(mins) < 60) return locale === "id" ? `${mins} menit lalu` : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return locale === "id" ? `${hours} jam lalu` : `${hours}h ago`;
  const daysAgo = Math.round(hours / 24);
  if (Math.abs(daysAgo) < 30) return locale === "id" ? `${daysAgo} hari lalu` : `${daysAgo}d ago`;
  return formatDate(d, { locale });
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function excerpt(text: string | null | undefined, length = 160) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= length) return clean;
  return `${clean.slice(0, length).trimEnd()}…`;
}

export function courseInitials(fullname: string) {
  const words = fullname.split(/\s+/).filter(Boolean);
  const out = words
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return out.slice(0, 2) || "CRS";
}

export function formNumber(value: FormDataEntryValue | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim();
  if (raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function safePath(next: string | null | undefined, fallback = "/my") {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function humanFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
