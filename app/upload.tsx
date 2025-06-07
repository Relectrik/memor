import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { FlatList, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { readString } from 'react-papaparse';

/**
 * List every CSV file you package.
 * Metro needs static requires, so enumerate them here once.
 */
const DECK_ASSETS = [
  { name: 'Intro Concurrency', file: require('../assets/decks/intro_concurrency_100_flashcards.csv') },
  { name: 'CA DMV Test', file: require('../assets/decks/ca_dmv_permit_flashcards.csv') },

] as const;

// Color schemes
const getColors = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#f8f9fa',
  cardBackground: isDark ? '#1c1c1e' : '#ffffff',
  text: isDark ? '#ffffff' : '#000000',
  title: isDark ? '#ffffff' : '#000000',
});

export default function Upload() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  
  /** Load a bundled asset, read its CSV, store in AsyncStorage */
  const loadDeck = async (assetModule: number) => {
    // 1. Resolve asset → local URI inside bundle
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();              // ensure it's on disk
    const uri = asset.localUri || asset.uri;  // Network fallback (web preview)

    // 2. Read file text & parse CSV
    const csvText = await FileSystem.readAsStringAsync(uri!, { encoding: 'utf8' });
    const { data } = readString(csvText, { header: true }) as any;

    // 3. Save deck JSON so Practice screen can load it
    await AsyncStorage.setItem('deck', JSON.stringify(data));
    alert(`Loaded ${data.length} cards`);
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 60 }]}
      data={DECK_ASSETS}
      keyExtractor={item => item.name}
      renderItem={({ item }) => (
        <Pressable style={[styles.card, { backgroundColor: colors.cardBackground }]} onPress={() => loadDeck(item.file)}>
          <Text style={[styles.title, { color: colors.title }]}>{item.name}</Text>
        </Pressable>
      )}
      ListHeaderComponent={<Text style={[styles.h1, { color: colors.text }]}>Select a Deck</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  h1: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: { fontSize: 18, textAlign: 'center' },
});
