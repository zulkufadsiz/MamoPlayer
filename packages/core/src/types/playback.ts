export type PlaybackSourceType = 'streaming' | 'offline';

export type PlaybackEventType =
  | 'ready'
  | 'play'
  | 'pause'
  | 'ended'
  | 'buffer_start'
  | 'buffer_end'
  | 'seek'
  | 'time_update'
  | 'source_type'
  | 'error';

export type PlaybackEventBase = {
  type: PlaybackEventType;
  timestamp: number;
};

export type PlaybackTimePayload = {
  position: number;
  duration?: number;
};

export type PlaybackEvent = PlaybackEventBase &
  PlaybackTimePayload & {
    reason?: 'user' | 'auto' | 'programmatic';
    sourceType?: PlaybackSourceType;
    error?: {
      message: string;
      code?: string | number;
    };
  };
