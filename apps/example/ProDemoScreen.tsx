import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const ProDemoScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>MamoPlayer Pro Demo</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <Text style={styles.placeholderText}>Coming soon</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ads</Text>
          <Text style={styles.placeholderText}>Coming soon</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watermark</Text>
          <Text style={styles.placeholderText}>Coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
  },
});

export default ProDemoScreen;
