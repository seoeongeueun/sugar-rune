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

// Parse a date string in the format "YYYY-MM-DD" and return a Date object
export function parseNoteDate(date: string | undefined) {
  if (!date) return new Date();

  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) return new Date();

  return new Date(year, month - 1, day);
}

// Get the month, day, and year from a Date object for form values
export function getDateFormValues(date: Date) {
  return {
    month: (date.getMonth() + 1).toString().padStart(2, "0"),
    day: date.getDate().toString().padStart(2, "0"),
    year: date.getFullYear().toString(),
  };
}

export async function requestCameraAccess() {
  if (!window.isSecureContext) {
    throw new Error("Camera access requires HTTPS or localhost.");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });

  stream.getTracks().forEach((track) => track.stop());
}

export function getCameraAccessErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera access is blocked.";
    }

    if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      return "No camera was found.";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The camera is already in use by another app.";
    }

    if (error.name === "OverconstrainedError") {
      return "The selected camera is not supported.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Camera access failed.";
}
