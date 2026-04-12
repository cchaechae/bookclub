/** Client-side validation helpers (unit-testable). */

export function trimOrEmpty(s: string): string {
  return s.trim();
}

export function validateRequired(value: string, label: string): string | null {
  if (!trimOrEmpty(value)) return `${label} is required.`;
  return null;
}

/** Cadence: required, > 0, at most two decimal places (matches server Decimal rules). */
export function validateCadence(raw: string): string | null {
  const t = trimOrEmpty(raw);
  if (!t) return "Cadence is required.";
  const n = Number(t);
  if (!Number.isFinite(n)) return "Enter a valid number.";
  if (n <= 0) return "Cadence must be greater than 0.";
  const parts = t.split(".");
  if (parts.length === 2 && parts[1].length > 2) {
    return "Use at most two decimal places.";
  }
  return null;
}

export function parseCadence(raw: string): number | null {
  const err = validateCadence(raw);
  if (err) return null;
  return Number(trimOrEmpty(raw));
}
