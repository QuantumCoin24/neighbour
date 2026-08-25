export interface NormalizedPostalInput {
  countryCode: string;
  postalCode: string;
}

export function normalizeCountryCode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizePostalCode(countryCode: string, value: string): string {
  const country = normalizeCountryCode(countryCode);
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  /*
   * Canonical matching is deliberately permissive.
   * Neighbour is not trying to validate every postal system on Earth.
   */
  let normalized = trimmed.normalize('NFKC').replace(/\s+/g, ' ').toUpperCase();

  /*
   * UK postcodes have a predictable final three-character inward code.
   * Canonicalise spacing without rejecting unusual but potentially valid
   * international postal formats elsewhere.
   */
  if (country === 'GB' || country === 'UK') {
    const compact = normalized.replace(/\s+/g, '');

    if (compact.length > 3) {
      normalized = `${compact.slice(0, -3)} ${compact.slice(-3)}`;
    } else {
      normalized = compact;
    }
  }

  return normalized;
}

export function normalizePostalInput(
  countryCode: string,
  postalCode: string,
): NormalizedPostalInput {
  return {
    countryCode: normalizeCountryCode(countryCode),
    postalCode: normalizePostalCode(countryCode, postalCode),
  };
}
