export type PipState = 'inactive' | 'entering' | 'active' | 'exiting';

export interface PipConfig {
  enabled?: boolean;
  autoEnter?: boolean;
}

export interface PipEvent {
  state: PipState;
  reason?: string;
}
