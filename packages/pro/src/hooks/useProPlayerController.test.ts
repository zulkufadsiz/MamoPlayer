import { act, renderHook } from '@testing-library/react-native';

import { useProPlayerController } from './useProPlayerController';

jest.mock('../pip/nativeBridge', () => ({
  subscribeToPipEvents: jest.fn(() => jest.fn()),
  requestPictureInPicture: jest.fn(),
}));

describe('useProPlayerController – diagnostics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── rebufferCount ────────────────────────────────────────────────────────

  describe('rebufferCount', () => {
    it('starts at zero', () => {
      const { result } = renderHook(() =>
        useProPlayerController({
          coreController: { position: 0, duration: 0, isBuffering: false },
        }),
      );

      expect(result.current.rebufferCount).toBe(0);
    });

    it('increments by 1 on a false→true isBuffering transition', async () => {
      const { result, rerender } = renderHook(
        ({ isBuffering }: { isBuffering: boolean }) =>
          useProPlayerController({
            coreController: { position: 0, duration: 0, isBuffering },
          }),
        { initialProps: { isBuffering: false } },
      );

      expect(result.current.rebufferCount).toBe(0);

      await act(async () => {
        rerender({ isBuffering: true });
      });

      expect(result.current.rebufferCount).toBe(1);
    });

    it('does not increment when isBuffering remains true across re-renders', async () => {
      const { result, rerender } = renderHook(
        ({ isBuffering }: { isBuffering: boolean }) =>
          useProPlayerController({
            coreController: { position: 0, duration: 0, isBuffering },
          }),
        { initialProps: { isBuffering: true } },
      );

      // First mount with isBuffering=true triggers one false→true transition
      const countAfterMount = result.current.rebufferCount;
      expect(countAfterMount).toBe(1);

      // Same value again — effect dependency unchanged, no additional increment
      await act(async () => {
        rerender({ isBuffering: true });
      });

      expect(result.current.rebufferCount).toBe(1);
    });

    it('increments again on a second false→true transition', async () => {
      const { result, rerender } = renderHook(
        ({ isBuffering }: { isBuffering: boolean }) =>
          useProPlayerController({
            coreController: { position: 0, duration: 0, isBuffering },
          }),
        { initialProps: { isBuffering: false } },
      );

      await act(async () => {
        rerender({ isBuffering: true });
      });
      expect(result.current.rebufferCount).toBe(1);

      await act(async () => {
        rerender({ isBuffering: false });
      });
      await act(async () => {
        rerender({ isBuffering: true });
      });
      expect(result.current.rebufferCount).toBe(2);
    });
  });

  // ─── lastErrorMessage ─────────────────────────────────────────────────────

  describe('lastErrorMessage', () => {
    it('is undefined initially', () => {
      const { result } = renderHook(() => useProPlayerController({}));

      expect(result.current.lastErrorMessage).toBeUndefined();
    });

    it('updates when notifyError is called with a playback error', async () => {
      const { result } = renderHook(() => useProPlayerController({}));

      await act(async () => {
        result.current.notifyError('Playback error: stream ended unexpectedly');
      });

      expect(result.current.lastErrorMessage).toBe(
        'Playback error: stream ended unexpectedly',
      );
    });

    it('updates when notifyError is called with an ad error', async () => {
      const { result } = renderHook(() => useProPlayerController({}));

      await act(async () => {
        result.current.notifyError('Ad error: ad tag failed to load');
      });

      expect(result.current.lastErrorMessage).toBe('Ad error: ad tag failed to load');
    });

    it('reflects only the most recently notified error message', async () => {
      const { result } = renderHook(() => useProPlayerController({}));

      await act(async () => {
        result.current.notifyError('First error');
      });
      await act(async () => {
        result.current.notifyError('Second error');
      });

      expect(result.current.lastErrorMessage).toBe('Second error');
    });
  });
});
