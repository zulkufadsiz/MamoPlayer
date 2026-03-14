/**
 * Current state of the picture-in-picture window.
 *
 * - `'inactive'` — PiP window is not open.
 * - `'entering'` — Transition animation to PiP is in progress.
 * - `'active'`   — PiP window is visible and playing.
 * - `'exiting'`  — Transition animation back to inline is in progress.
 */
export type PipState = 'inactive' | 'entering' | 'active' | 'exiting';

/** Configuration for picture-in-picture support. */
export interface PipConfig {
  /** Enable the PiP button and feature. Defaults to `false`. */
  enabled?: boolean;
  /** Automatically enter PiP when the app is backgrounded. Defaults to `false`. */
  autoEnter?: boolean;
}

/** Event fired when the PiP window state changes. */
export interface PipEvent {
  /** New PiP state. */
  state: PipState;
  /** Optional human-readable reason for the transition (e.g. `'user_dismissed'`). */
  reason?: string;
}
