export interface LicenseCheckResult {
  valid: boolean;
  reason?: string;
}

export function validateLicenseKey(licenseKey?: string): LicenseCheckResult {
  // Real access control for Pro features is enforced via private npm package access.
  if (!licenseKey) {
    return { valid: false, reason: 'NO_KEY' };
  }

  if (!licenseKey.startsWith('MAMO-')) {
    return { valid: false, reason: 'INVALID_FORMAT' };
  }

  return { valid: true };
}