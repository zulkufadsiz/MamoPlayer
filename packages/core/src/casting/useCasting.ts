import React from 'react';

import { getCastState, isCastNativeAvailable, showCastPicker, subscribeToCastEvents } from './nativeBridge';
import type { CastState } from '../types/casting';

export interface UseCastingResult {
  /** Current state of the cast session. */
  castState: CastState;
  /** Open the platform cast device picker. */
  showPicker: () => void;
}

/**
 * Tracks cast session state and exposes a picker trigger.
 *
 * Fetches the initial state from the native layer on mount, then keeps it
 * up to date via the `mamo_cast_state_changed` native event.
 */
export const useCasting = (): UseCastingResult => {
  const available = isCastNativeAvailable();
  const [castState, setCastState] = React.useState<CastState>(available ? 'idle' : 'unavailable');

  React.useEffect(() => {
    if (!available) {
      setCastState('unavailable');
      return;
    }

    let cancelled = false;

    // Prime state from the native layer (avoids a flash of stale state).
    getCastState().then((state) => {
      if (!cancelled) setCastState(state);
    });

    const unsubscribe = subscribeToCastEvents((state) => {
      if (!cancelled) setCastState(state);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [available]);

  const showPicker = React.useCallback(() => {
    showCastPicker();
  }, []);

  return { castState, showPicker };
};
