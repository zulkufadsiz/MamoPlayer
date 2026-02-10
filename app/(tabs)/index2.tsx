import ZPlayerDemo from '@/components/ZPlayerDemo';
import { useNavigation } from 'expo-router';
import React, { useEffect } from 'react';

export default function Index2Screen() {
  const navigation = useNavigation();

  useEffect(() => {
    // Hide tab bar when this screen is mounted
    navigation.setOptions({
      tabBarStyle: { display: 'none' }
    });

    // Show tab bar when component unmounts
    return () => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  return (
    <ZPlayerDemo />
  );
}
