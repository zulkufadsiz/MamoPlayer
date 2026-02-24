export type PipState = "inactive" | "entering" | "active" | "exiting";

export interface PipConfig {
  enabled: boolean;
}

export interface PipEvent {
  state: PipState;
}
