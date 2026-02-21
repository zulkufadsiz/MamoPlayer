import type { PlaybackEvent } from '@mamoplayer/core';

export type AnalyticsEventType =
  | 'ad_start'
  | 'ad_complete'
  | 'ad_error'
  | 'session_start'
  | 'session_end'
  | 'play'
  | 'pause'
  | 'ended'
  | 'buffer_start'
  | 'buffer_end'
  | 'seek'
  | 'quartile';

export interface AnalyticsEventBase {
  type: AnalyticsEventType;
  timestamp: number;
}

export interface AnalyticsEvent extends AnalyticsEventBase {
  position: number;
  duration?: number;
  playbackEvent?: PlaybackEvent;
  quartile?: 25 | 50 | 75 | 100;
  adTagUrl?: string;
  adPosition?: 'preroll' | 'midroll' | 'postroll';
  errorMessage?: string;
  mainContentPositionAtAdStart?: number;
  sessionId?: string;
}

export interface AnalyticsConfig {
  onEvent: (event: AnalyticsEvent) => void;
  sessionId?: string;
}
