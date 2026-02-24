export interface AdSource {
  uri: string;
  type?: 'video/mp4' | 'application/x-mpegURL';
}

export interface AdBreak {
  type: 'preroll' | 'midroll' | 'postroll';
  time?: number; // Only for midroll
  source: AdSource;
}

export interface AdsConfig {
  adBreaks: AdBreak[];
  skipButtonEnabled?: boolean;
  skipAfterSeconds?: number;
}

export type AdBreakType = AdBreak['type'];
