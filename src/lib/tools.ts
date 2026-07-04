import * as THREE from "three";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Something went wrong. Please try again.";
}

//mask 50% of email for privacy
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  const len = local.length;
  if (len < 2) return email; // skip masking for very short local parts

  const half = Math.floor(len * 0.5);
  const start = Math.floor((len - half) / 2);
  const end = start + half;

  const masked =
    local.slice(0, start) + "*".repeat(end - start) + local.slice(end);

  return `${masked}@${domain}`;
}

export function saturateHexColor(hexColor: string, saturationLevel = 1) {
  const color = new THREE.Color(hexColor);
  const hsl = { h: 0, s: 0, l: 0 };

  color.getHSL(hsl);
  color.setHSL(hsl.h, Math.min(1, hsl.s * saturationLevel), hsl.l);

  return `#${color.getHexString()}`;
}

// Format a Date object to a string in the format "YYYY-MM-DD" for database storage
export function formatDateForDb(date: Date) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Parse a date string in the format "YYYY-MM-DD" and return a Date object
export function getSubmittedDate(
  data: { month: string; day: string; year: string },
  fallbackDate: Date,
) {
  const { month, day, year } = data;

  if (!month || !day || !year) {
    return fallbackDate;
  }

  const dateString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const nextDate = new Date(dateString);

  return Number.isNaN(nextDate.getTime()) ? fallbackDate : nextDate;
}
