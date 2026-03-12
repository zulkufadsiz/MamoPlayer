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

  it('calls onSeek with the correct time as the user drags', () => {
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
      touchArea!.props.onResponderMove({ nativeEvent: { locationX: 75 } });
    });

    // locationX 75 out of track width 100 → 75% of duration 200 = 150 s
    expect(onSeek).toHaveBeenLastCalledWith(150);
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
