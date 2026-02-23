import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const CoreDemoScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>MamoPlayer Core Demo</Text>

      <View style={styles.playerArea}>
        <Text style={styles.playerPlaceholderText}>Video Player Area</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  playerArea: {
    height: 220,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerPlaceholderText: {
    fontSize: 16,
  },
});

export default CoreDemoScreen;