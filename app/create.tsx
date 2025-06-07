import { SafeAreaView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Color schemes
const getColors = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#f8f9fa',
  text: isDark ? '#ffffff' : '#000000',
  secondaryText: isDark ? '#8e8e93' : '#666666',
  brand: '#007AFF',
});

export default function Create() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Create</Text>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>📝</Text>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>Create Custom Decks</Text>
          <Text style={[styles.placeholderText, { color: colors.secondaryText }]}>
            This feature will allow you to create your own flashcard decks.
          </Text>
          <Text style={[styles.comingSoon, { color: colors.brand }]}>Coming Soon!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 40,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  comingSoon: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 