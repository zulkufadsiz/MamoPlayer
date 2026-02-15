import React from 'react';
import { MamoPlayer, type MamoPlayerProps } from './components/MamoPlayer';
import { hasPremiumEntitlement, requirePremiumEntitlement, type PremiumFeature } from './licensing';

export {
  addPremiumEntitlements,
  clearPremiumEntitlements,
  hasPremiumEntitlement,
  PremiumFeatureError,
  requirePremiumEntitlement,
  setPremiumEntitlements,
  type PremiumFeature,
} from './licensing';

export type PremiumGateProps = {
  feature: PremiumFeature;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export const PremiumGate: React.FC<PremiumGateProps> = ({ feature, fallback = null, children }) => {
  return hasPremiumEntitlement(feature) ? <>{children}</> : <>{fallback}</>;
};

export const PremiumMamoPlayer: React.FC<MamoPlayerProps> = (props) => {
  if (props.playerType === 'vertical') {
    requirePremiumEntitlement('vertical-player');
  }

  if (props.playerType === 'landscape') {
    requirePremiumEntitlement('landscape-player');
  }

  return <MamoPlayer {...props} />;
};

export { default as PremiumLandscapePlayer } from './components/LandscapePlayer';
export { default as PremiumVerticalPlayer } from './components/VerticalPlayer';
