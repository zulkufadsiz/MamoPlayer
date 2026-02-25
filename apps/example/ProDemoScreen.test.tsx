import ProDemoScreen from '@/apps/example/ProDemoScreen';
import { render } from '@testing-library/react-native';

describe('ProDemoScreen', () => {
  it('renders title and coming soon placeholders', () => {
    const { getByText, getAllByText } = render(<ProDemoScreen />);

    expect(getByText('MamoPlayer Pro Demo')).toBeTruthy();
    expect(getByText('Analytics')).toBeTruthy();
    expect(getByText('Ads')).toBeTruthy();
    expect(getByText('Watermark')).toBeTruthy();
    expect(getAllByText('Coming soon')).toHaveLength(3);
  });
});
