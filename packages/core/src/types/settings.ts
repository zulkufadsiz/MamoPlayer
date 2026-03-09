import type { ReactNode } from 'react';

export interface SettingsOverlayExtraMenuOption {
  id: string;
  label: string;
}

export interface SettingsOverlayExtraMenuItem {
  key: string;
  title: string;
  value?: string;
  options: SettingsOverlayExtraMenuOption[];
  selectedOptionId?: string;
  onSelectOption: (optionId: string) => void;
}

export interface SettingsOverlayConfig {
  enabled?: boolean;
  showPlaybackSpeed?: boolean;
  showMute?: boolean;
  showQuality?: boolean;
  showSubtitles?: boolean;
  showAudioTracks?: boolean;
  extraItems?: ReactNode;
  extraMenuItems?: SettingsOverlayExtraMenuItem[];
}
