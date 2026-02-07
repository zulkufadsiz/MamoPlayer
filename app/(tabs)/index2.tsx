import ZPlayerDemo from '@/components/ZPlayerDemo';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index2Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ZPlayerDemo />
    </SafeAreaView>
  );
}
