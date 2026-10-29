/**
 * Parses and validates a number from an input string or number.
 * Returns null if empty or invalid, or throws/returns validated number.
 */
export function sanitizeNonNegativeNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const str = String(value).trim().replace(',', '.');
  const num = Number(str);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}

/**
 * Validates a weight in kilograms (0 to 1000 kg, supports decimals up to 2 decimal places)
 */
export function validateWeight(value: string | number | null | undefined): { isValid: boolean; value: number | null; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, value: null };
  }
  const str = String(value).trim().replace(',', '.');
  const num = Number(str);
  if (isNaN(num)) {
    return { isValid: false, value: null, error: 'Вес должен быть числом' };
  }
  if (num < 0) {
    return { isValid: false, value: null, error: 'Вес не может быть отрицательным' };
  }
  if (num > 1000) {
    return { isValid: false, value: null, error: 'Слишком большой вес (макс. 1000 кг)' };
  }
  // Round to max 2 decimals
  const rounded = Math.round(num * 100) / 100;
  return { isValid: true, value: rounded };
}

/**
 * Validates reps count (non-negative integer, e.g. 0 to 500)
 */
export function validateReps(value: string | number | null | undefined): { isValid: boolean; value: number | null; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, value: null };
  }
  const str = String(value).trim();
  const num = Number(str);
  if (isNaN(num) || !Number.isInteger(num)) {
    return { isValid: false, value: null, error: 'Повторения должны быть целым числом' };
  }
  if (num < 0) {
    return { isValid: false, value: null, error: 'Повторения не могут быть отрицательными' };
  }
  if (num > 1000) {
    return { isValid: false, value: null, error: 'Слишком большое количество повторений' };
  }
  return { isValid: true, value: num };
}

/**
 * Validates distance in meters (non-negative, up to 1,000,000 m = 1000 km)
 */
export function validateDistance(value: string | number | null | undefined): { isValid: boolean; value: number | null; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, value: null };
  }
  const str = String(value).trim().replace(',', '.');
  const num = Number(str);
  if (isNaN(num) || num < 0) {
    return { isValid: false, value: null, error: 'Дистанция не может быть отрицательной' };
  }
  return { isValid: true, value: Math.round(num * 100) / 100 };
}

/**
 * Validates duration in seconds (non-negative integer)
 */
export function validateDuration(value: string | number | null | undefined): { isValid: boolean; value: number | null; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, value: null };
  }
  const str = String(value).trim();
  const num = Number(str);
  if (isNaN(num) || num < 0) {
    return { isValid: false, value: null, error: 'Время не может быть отрицательным' };
  }
  return { isValid: true, value: Math.round(num) };
}
