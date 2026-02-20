export type PlaybackEventType =
  | 'ready'
  | 'play'
  | 'pause'
  | 'ended'
  | 'buffer_start'
  | 'buffer_end'
  | 'seek'
  | 'time_update'
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
    error?: {
      message: string;
      code?: string | number;
    };
  };
