export function required(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  return '';
}

export function emailError(value: string) {
  if (!value.trim()) return 'Email is required.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address.';
}

export function lengthError(value: string, label: string, minimum: number, maximum: number) {
  const length = value.trim().length;
  if (length < minimum) return `${label} must be at least ${minimum} characters.`;
  if (length > maximum) return `${label} must be ${maximum} characters or fewer.`;
  return '';
}

export function dateError(value: string) {
  if (!value.trim()) return 'Start time is required.';
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? 'Use a valid date/time, such as 2026-09-30T14:00:00Z.' : '';
}
