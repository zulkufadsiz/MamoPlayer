import {
  addPremiumEntitlements,
  clearPremiumEntitlements,
  hasPremiumEntitlement,
  PremiumFeatureError,
  requirePremiumEntitlement,
  setPremiumEntitlements,
} from '../licensing';

describe('licensing', () => {
  afterEach(() => {
    clearPremiumEntitlements();
  });

  it('grants and checks entitlements', () => {
    setPremiumEntitlements(['vertical-player']);

    expect(hasPremiumEntitlement('vertical-player')).toBe(true);
    expect(hasPremiumEntitlement('landscape-player')).toBe(false);
  });

  it('adds to existing entitlements', () => {
    setPremiumEntitlements(['vertical-player']);
    addPremiumEntitlements(['landscape-player']);

    expect(hasPremiumEntitlement('vertical-player')).toBe(true);
    expect(hasPremiumEntitlement('landscape-player')).toBe(true);
  });

  it('throws when premium entitlement is missing', () => {
    expect(() => requirePremiumEntitlement('advanced-settings')).toThrow(PremiumFeatureError);
  });

  it('passes when premium entitlement exists', () => {
    setPremiumEntitlements(['advanced-settings']);

    expect(() => requirePremiumEntitlement('advanced-settings')).not.toThrow();
  });
});
