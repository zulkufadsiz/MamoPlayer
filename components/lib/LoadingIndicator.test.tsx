import LoadingIndicator from '@/components/lib/LoadingIndicator';
import { render } from '@testing-library/react-native';
import React from 'react';

describe('LoadingIndicator', () => {
  it.each(['dots', 'ring', 'neon', 'wave', 'brand', 'combo'] as const)(
    'renders %s variant',
    (variant) => {
      const { toJSON } = render(
        <LoadingIndicator
          size={42}
          color="#FFF"
          variant={variant}
          brandColors={['#111', '#222', '#333']}
        />,
      );

      expect(toJSON()).toBeTruthy();
    },
  );
});
