import { validateLicenseKey } from './license';

describe('validateLicenseKey', () => {
  it('returns NO_KEY when key is missing', () => {
    expect(validateLicenseKey()).toEqual({ valid: false, reason: 'NO_KEY' });
  });

  it('returns INVALID_FORMAT when key does not match prefix', () => {
    expect(validateLicenseKey('ABC-123')).toEqual({ valid: false, reason: 'INVALID_FORMAT' });
  });

  it('returns valid for MAMO-prefixed key', () => {
    expect(validateLicenseKey('MAMO-12345')).toEqual({ valid: true });
  });
});
