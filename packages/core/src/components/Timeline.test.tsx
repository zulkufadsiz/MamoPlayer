import { act, render } from '@testing-library/react-native';
import { PanResponder, View } from 'react-native';
import { Timeline } from './Timeline';

// PanResponder's internal handlers invoke TouchHistoryMath which requires a
// fully-formed touchHistory object that is never populated in the Jest / JSDom
// environment. Spying on PanResponder.create and forwarding the user-space
// callbacks (onPanResponderGrant etc.) directly avoids the internal book-keeping.
/* eslint-disable @typescript-eslint/no-explicit-any */
function mockPanResponder() {
  return jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => ({
    panHandlers: {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      onResponderGrant: (evt: unknown) => config.onPanResponderGrant?.(evt, {}),
      onResponderMove: (evt: unknown) => config.onPanResponderMove?.(evt, {}),
      onResponderRelease: (evt: unknown) => config.onPanResponderRelease?.(evt, {}),
      onResponderTerminate: (evt: unknown) => config.onPanResponderTerminate?.(evt, {}),
    },
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('Timeline', () => {
  let panResponderSpy: ReturnType<typeof mockPanResponder>;

  beforeEach(() => {
    panResponderSpy = mockPanResponder();
  });

  afterEach(() => {
    panResponderSpy.mockRestore();
  });
  it('renders without crashing given valid duration and position', () => {
    expect(() => render(<Timeline duration={120} position={30} />)).not.toThrow();
  });

  it('renders without crashing when duration is zero', () => {
    expect(() => render(<Timeline duration={0} position={0} />)).not.toThrow();
  });

  it('applies played fill proportional to position / duration', () => {
    const { UNSAFE_getAllByType } = render(<Timeline duration={100} position={40} />);

    const views = UNSAFE_getAllByType(View);
    const playedFill = views.find(v => {
      const flat = Array.isArray(v.props.style) ? v.props.style : [v.props.style];
      return flat.some(
        (s: Record<string, unknown>) =>
          s &&
          typeof s === 'object' &&
          'width' in s &&
          s.width === '40%',
      );
    });

    expect(playedFill).toBeTruthy();
  });

  it('shows played fill at 0% when position is zero', () => {
    const { UNSAFE_getAllByType } = render(<Timeline duration={100} position={0} />);

    const views = UNSAFE_getAllByType(View);
    const playedFill = views.find(v => {
      const flat = Array.isArray(v.props.style) ? v.props.style : [v.props.style];
      return flat.some(
        (s: Record<string, unknown>) =>
          s &&
          typeof s === 'object' &&
          'width' in s &&
          s.width === '0%',
      );
    });

    expect(playedFill).toBeTruthy();
  });

  it('renders buffered fill when buffered prop is provided', () => {
    const { UNSAFE_getAllByType } = render(
      <Timeline duration={100} position={10} buffered={60} />,
    );

    const views = UNSAFE_getAllByType(View);
    const bufferedFill = views.find(v => {
      const flat = Array.isArray(v.props.style) ? v.props.style : [v.props.style];
      return flat.some(
        (s: Record<string, unknown>) =>
          s &&
          typeof s === 'object' &&
          'width' in s &&
          s.width === '60%',
      );
    });

    expect(bufferedFill).toBeTruthy();
  });

  it('does not render buffered fill when buffered prop is omitted', () => {
    const { UNSAFE_getAllByType } = render(<Timeline duration={100} position={10} />);

    const views = UNSAFE_getAllByType(View);
    const bufferedFill = views.find(v => {
      const flat = Array.isArray(v.props.style) ? v.props.style : [v.props.style];
      return flat.some(
        (s: Record<string, unknown>) =>
          s &&
          typeof s === 'object' &&
          'backgroundColor' in s &&
          s.backgroundColor === '#6B7280',
      );
    });

    expect(bufferedFill).toBeUndefined();
  });

  it('calls onScrubStart when a scrub gesture begins', () => {
    const onScrubStart = jest.fn();
    const onSeek = jest.fn();

    const { UNSAFE_getAllByType } = render(
      <Timeline duration={100} position={0} onScrubStart={onScrubStart} onSeek={onSeek} />,
    );

    const touchArea = UNSAFE_getAllByType(View).find(
      v => typeof v.props.onLayout === 'function' && v.props.onStartShouldSetResponder,
    );

    expect(touchArea).toBeTruthy();

    act(() => {
      touchArea!.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
    });

    act(() => {
      touchArea!.props.onResponderGrant({ nativeEvent: { locationX: 50 } });
    });

    expect(onScrubStart).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledWith(25); // 50 / 200 * 100
  });

  it('does not call onSeek during scrub moves – position is tracked locally', () => {
    const onSeek = jest.fn();

    const { UNSAFE_getAllByType } = render(
      <Timeline duration={200} position={0} onSeek={onSeek} />,
    );

    const touchArea = UNSAFE_getAllByType(View).find(
      v => typeof v.props.onLayout === 'function' && v.props.onStartShouldSetResponder,
    );

    expect(touchArea).toBeTruthy();

    act(() => {
      touchArea!.props.onLayout({ nativeEvent: { layout: { width: 100 } } });
    });

    act(() => {
      touchArea!.props.onResponderGrant({ nativeEvent: { locationX: 0 } });
    });

    const callsAfterGrant = onSeek.mock.calls.length;

    act(() => {
      touchArea!.props.onResponderMove({ nativeEvent: { locationX: 75 } });
      touchArea!.props.onResponderMove({ nativeEvent: { locationX: 90 } });
    });

    // No additional onSeek calls should fire during moves.
    expect(onSeek.mock.calls.length).toBe(callsAfterGrant);
  });

  it('freezes the played fill during scrubbing when the position prop updates', () => {
    const { rerender, UNSAFE_getAllByType } = render(
      <Timeline duration={100} position={0} />,
    );

    const touchArea = UNSAFE_getAllByType(View).find(
      v => typeof v.props.onLayout === 'function' && v.props.onStartShouldSetResponder,
    );

    expect(touchArea).toBeTruthy();

    act(() => {
      touchArea!.props.onLayout({ nativeEvent: { layout: { width: 100 } } });
    });

    // Scrub to 40 %
    act(() => {
      touchArea!.props.onResponderGrant({ nativeEvent: { locationX: 40 } });
    });

    // Simulate a position update arriving from normal playback (should be ignored visually).
    rerender(<Timeline duration={100} position={70} />);

    // The played fill must reflect the scrub position (40 %), not the incoming prop (70 %).
    const views = UNSAFE_getAllByType(View);
    const scrubFill = views.find(v => {
      const flat = Array.isArray(v.props.style) ? v.props.style : [v.props.style];
      return flat.some(
        (s: Record<string, unknown>) =>
          s && typeof s === 'object' && 'width' in s && s.width === '40%',
      );
    });

    expect(scrubFill).toBeTruthy();
  });

  it('calls onScrubEnd with the last tracked time when the gesture is terminated', () => {
    const onScrubEnd = jest.fn();

    const { UNSAFE_getAllByType } = render(
      <Timeline duration={100} position={0} onScrubEnd={onScrubEnd} />,
    );

    const touchArea = UNSAFE_getAllByType(View).find(
      v => typeof v.props.onLayout === 'function' && v.props.onStartShouldSetResponder,
    );

    expect(touchArea).toBeTruthy();

    act(() => {
      touchArea!.props.onLayout({ nativeEvent: { layout: { width: 100 } } });
    });

    act(() => {
      touchArea!.props.onResponderGrant({ nativeEvent: { locationX: 0 } });
      touchArea!.props.onResponderMove({ nativeEvent: { locationX: 60 } }); // 60 s
    });

    act(() => {
      touchArea!.props.onResponderTerminate({});
    });

    // Should commit the position from the last move event.
    expect(onScrubEnd).toHaveBeenCalledWith(60);
  });

  it('calls onScrubEnd with the final seek time on release', () => {
    const onScrubEnd = jest.fn();

    const { UNSAFE_getAllByType } = render(
      <Timeline duration={100} position={0} onScrubEnd={onScrubEnd} />,
    );

    const touchArea = UNSAFE_getAllByType(View).find(
      v => typeof v.props.onLayout === 'function' && v.props.onStartShouldSetResponder,
    );

    expect(touchArea).toBeTruthy();

    act(() => {
      touchArea!.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
    });

    act(() => {
      touchArea!.props.onResponderGrant({ nativeEvent: { locationX: 0 } });
      touchArea!.props.onResponderRelease({ nativeEvent: { locationX: 100 } });
    });

    expect(onScrubEnd).toHaveBeenCalledWith(50); // 100 / 200 * 100
  });

  it('clamps position to valid range so played fill does not exceed 100%', () => {
    const { UNSAFE_getAllByType } = render(<Timeline duration={100} position={150} />);

    const views = UNSAFE_getAllByType(View);
    const playedFill = views.find(v => {
      const flat = Array.isArray(v.props.style) ? v.props.style : [v.props.style];
      return flat.some(
        (s: Record<string, unknown>) =>
          s &&
          typeof s === 'object' &&
          'width' in s &&
          s.width === '100%',
      );
    });

    expect(playedFill).toBeTruthy();
  });
});
