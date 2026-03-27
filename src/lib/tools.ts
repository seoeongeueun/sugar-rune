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
