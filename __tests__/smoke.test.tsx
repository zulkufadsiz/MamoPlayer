import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

describe('test environment', () => {
  it('renders a basic react-native component', () => {
    const { getByText } = render(<Text>MamoPlayer Test</Text>);
    expect(getByText('MamoPlayer Test')).toBeTruthy();
  });
});
