/**
 * Philippine Standard Time (PST / PHT) Utilities
 * Sto. Tomas, Pampanga Online Permitting System (eTAYO)
 * Time Zone: Asia/Manila (UTC+8, no daylight saving time)
 */

export const PHT_TIMEZONE = "Asia/Manila";

/**
 * Returns current Date in milliseconds, aligned with Philippine Standard Time
 */
export function getPhilippineNow(): Date {
  return new Date();
}

/**
 * Parses any date string or timestamp safely into a valid Date object.
 * If given a date string like "2026-10-02 06:41:00" without timezone info,
 * it anchors it to Philippine local time (+08:00).
 */
export function parsePhilippineDate(input?: string | number | Date | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
  if (typeof input === "number") return new Date(input);

  const str = String(input).trim();
  if (!str) return new Date();

  // If numeric string timestamp (e.g. "1727829600000")
  if (/^\d{10,13}$/.test(str)) {
    return new Date(Number(str));
  }

  // If string contains date and time without 'Z' or timezone offset (+/-), anchor to Asia/Manila (+08:00)
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
    const iso = str.replace(" ", "T");
    return new Date(`${iso}+08:00`);
  }

  // Standard parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
}

/**
 * Formats time strictly in Philippine Standard Time (e.g. "6:38 AM")
 */
export function formatPhilippineTime(input?: string | number | Date | null): string {
  try {
    const d = parsePhilippineDate(input);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: PHT_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Formats date strictly in Philippine Standard Time (e.g. "Oct 2, 2026")
 */
export function formatPhilippineDate(input?: string | number | Date | null): string {
  try {
    const d = parsePhilippineDate(input);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: PHT_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Formats date and time strictly in Philippine Standard Time (e.g. "6:38 AM · Oct 2, 2026")
 * If the input is date-only (e.g. "Oct 08, 2026", "2026-10-08"), it cleanly formats as date only ("Oct 8, 2026")
 * instead of fabricating a fake midnight "12:00 AM".
 */
export function formatPhilippineDateTime(input?: string | number | Date | null): string {
  try {
    if (!input) return "";

    // If input is a string that has no time information (no colon), return date only
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed.includes(":")) {
        return formatPhilippineDate(trimmed);
      }
    }

    const d = parsePhilippineDate(input);
    const datePart = new Intl.DateTimeFormat("en-US", {
      timeZone: PHT_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(d);
    const timePart = new Intl.DateTimeFormat("en-US", {
      timeZone: PHT_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(d);

    // If parsed as 12:00 AM and input is a string that doesn't explicitly specify midnight, return datePart only
    if (timePart === "12:00 AM" && typeof input === "string") {
      const lower = input.toLowerCase();
      if (!lower.includes("12:00") && !lower.includes("00:00")) {
        return datePart;
      }
    }

    return `${timePart} · ${datePart}`;
  } catch {
    return "";
  }
}

/**
 * Formats date and time with relative indicator ("Just now", "5m ago", etc.) using Philippine timezone
 */
export function formatPhilippineRelativeDateTime(input?: string | number | Date | null): string {
  try {
    const d = parsePhilippineDate(input);
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);

    let relative = "";
    if (diffSec < 60) relative = "Just now";
    else if (diffSec < 3600) relative = `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
    else if (diffSec < 604800) relative = `${Math.floor(diffSec / 86400)}d ago`;

    const fullStr = formatPhilippineDateTime(d);
    return relative ? `${fullStr} (${relative})` : fullStr;
  } catch {
    return "";
  }
}
