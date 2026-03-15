import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';

const { DoubleTapSeekOverlay } = require('./DoubleTapSeekOverlay') as typeof import('./DoubleTapSeekOverlay');

describe('DoubleTapSeekOverlay', () => {
  let timingSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: (cb?: (result: { finished: boolean }) => void) => {
        cb?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    }));
  });

  afterEach(() => {
    timingSpy.mockRestore();
    jest.useRealTimers();
  });

  const setup = (overrides: Partial<React.ComponentProps<typeof DoubleTapSeekOverlay>> = {}) => {
    const onSeekBackward = jest.fn();
    const onSeekForward = jest.fn();
    const onSingleTap = jest.fn();

    const utils = render(
      <DoubleTapSeekOverlay
        onSeekBackward={onSeekBackward}
        onSeekForward={onSeekForward}
        onSingleTap={onSingleTap}
        {...overrides}
      />,
    );

    return { ...utils, onSeekBackward, onSeekForward, onSingleTap };
  };

  // ─── Seek zones ───────────────────────────────────────────────────────────

  it('renders left and right tap zones', () => {
    const { getByTestId } = setup();
    expect(getByTestId('double-tap-left')).toBeTruthy();
    expect(getByTestId('double-tap-right')).toBeTruthy();
  });

  // ─── Double-tap → seek ────────────────────────────────────────────────────

  it('calls onSeekBackward on double-tap of left zone', () => {
    const { getByTestId, onSeekBackward, onSingleTap } = setup();
    const left = getByTestId('double-tap-left');

    act(() => { fireEvent.press(left); });
    act(() => { fireEvent.press(left); });

    expect(onSeekBackward).toHaveBeenCalledTimes(1);
    expect(onSingleTap).not.toHaveBeenCalled();
  });

  it('calls onSeekForward on double-tap of right zone', () => {
    const { getByTestId, onSeekForward, onSingleTap } = setup();
    const right = getByTestId('double-tap-right');

    act(() => { fireEvent.press(right); });
    act(() => { fireEvent.press(right); });

    expect(onSeekForward).toHaveBeenCalledTimes(1);
    expect(onSingleTap).not.toHaveBeenCalled();
  });

  // ─── Single-tap → toggle controls ────────────────────────────────────────

  it('calls onSingleTap after delay on single-tap of left zone', () => {
    const { getByTestId, onSeekBackward, onSingleTap } = setup();

    act(() => { fireEvent.press(getByTestId('double-tap-left')); });

    // Not fired yet — waiting for double-tap window
    expect(onSingleTap).not.toHaveBeenCalled();

    // Advance past the double-tap delay
    act(() => { jest.runAllTimers(); });

    expect(onSingleTap).toHaveBeenCalledTimes(1);
    expect(onSeekBackward).not.toHaveBeenCalled();
  });

  it('calls onSingleTap after delay on single-tap of right zone', () => {
    const { getByTestId, onSeekForward, onSingleTap } = setup();

    act(() => { fireEvent.press(getByTestId('double-tap-right')); });

    expect(onSingleTap).not.toHaveBeenCalled();

    act(() => { jest.runAllTimers(); });

    expect(onSingleTap).toHaveBeenCalledTimes(1);
    expect(onSeekForward).not.toHaveBeenCalled();
  });

  // ─── No cross-zone bleeding ───────────────────────────────────────────────

  it('does not treat left then right tap as a double-tap', () => {
    const { getByTestId, onSeekBackward, onSeekForward, onSingleTap } = setup();

    act(() => { fireEvent.press(getByTestId('double-tap-left')); });
    act(() => { fireEvent.press(getByTestId('double-tap-right')); });
    act(() => { jest.runAllTimers(); });

    expect(onSeekBackward).not.toHaveBeenCalled();
    expect(onSeekForward).not.toHaveBeenCalled();
    // Both taps resolve as single taps
    expect(onSingleTap).toHaveBeenCalledTimes(2);
  });

  // ─── Double-tap cancels the single-tap timer ──────────────────────────────

  it('does not call onSingleTap after a double-tap on left zone', () => {
    const { getByTestId, onSeekBackward, onSingleTap } = setup();
    const left = getByTestId('double-tap-left');

    act(() => { fireEvent.press(left); });
    act(() => { fireEvent.press(left); });
    act(() => { jest.runAllTimers(); });

    expect(onSeekBackward).toHaveBeenCalledTimes(1);
    expect(onSingleTap).not.toHaveBeenCalled();
  });

  it('does not call onSingleTap after a double-tap on right zone', () => {
    const { getByTestId, onSeekForward, onSingleTap } = setup();
    const right = getByTestId('double-tap-right');

    act(() => { fireEvent.press(right); });
    act(() => { fireEvent.press(right); });
    act(() => { jest.runAllTimers(); });

    expect(onSeekForward).toHaveBeenCalledTimes(1);
    expect(onSingleTap).not.toHaveBeenCalled();
  });

  // ─── Consecutive double-taps ──────────────────────────────────────────────

  it('handles consecutive double-taps on the same zone', () => {
    const { getByTestId, onSeekForward, onSingleTap } = setup();
    const right = getByTestId('double-tap-right');

    // First double-tap
    act(() => { fireEvent.press(right); });
    act(() => { fireEvent.press(right); });

    // Second double-tap
    act(() => { fireEvent.press(right); });
    act(() => { fireEvent.press(right); });

    act(() => { jest.runAllTimers(); });

    expect(onSeekForward).toHaveBeenCalledTimes(2);
    expect(onSingleTap).not.toHaveBeenCalled();
  });
});
