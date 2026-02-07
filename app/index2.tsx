import { SafeAreaView } from 'react-native-safe-area-context';
import ZPlayerDemo from '../components/ZPlayerDemo';

export default function Index2Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ZPlayerDemo />
    </SafeAreaView>
  );
}
