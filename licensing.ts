export type PremiumFeature =
  | 'vertical-player'
  | 'landscape-player'
  | 'comments'
  | 'offline-library'
  | 'analytics'
  | 'advanced-settings';

const grantedPremiumFeatures = new Set<PremiumFeature>();

export class PremiumFeatureError extends Error {
  code = 'PREMIUM_FEATURE_REQUIRED';
  feature: PremiumFeature;

  constructor(feature: PremiumFeature) {
    super(`Premium feature required: ${feature}`);
    this.name = 'PremiumFeatureError';
    this.feature = feature;
  }
}

export const setPremiumEntitlements = (features: PremiumFeature[]) => {
  grantedPremiumFeatures.clear();
  features.forEach((feature) => grantedPremiumFeatures.add(feature));
};

export const addPremiumEntitlements = (features: PremiumFeature[]) => {
  features.forEach((feature) => grantedPremiumFeatures.add(feature));
};

export const clearPremiumEntitlements = () => {
  grantedPremiumFeatures.clear();
};

export const hasPremiumEntitlement = (feature: PremiumFeature): boolean => {
  return grantedPremiumFeatures.has(feature);
};

export const requirePremiumEntitlement = (feature: PremiumFeature) => {
  if (!hasPremiumEntitlement(feature)) {
    throw new PremiumFeatureError(feature);
  }
};
