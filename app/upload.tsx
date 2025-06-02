import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { readString } from 'react-papaparse';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * List every CSV file you package.
 * Metro needs static requires, so enumerate them here once.
 */
const DECK_ASSETS = [
  { name: 'Intro Concurrency', file: require('../assets/decks/intro_concurrency_100_flashcards.csv') },
  { name: 'CA DMV Test', file: require('../assets/decks/ca_dmv_permit_flashcards.csv') },

] as const;

export default function Upload() {
  /** Load a bundled asset, read its CSV, store in AsyncStorage */
  const loadDeck = async (assetModule: number) => {
    // 1. Resolve asset → local URI inside bundle
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();              // ensure it’s on disk
    const uri = asset.localUri || asset.uri;  // Network fallback (web preview)

    // 2. Read file text & parse CSV
    const csvText = await FileSystem.readAsStringAsync(uri!, { encoding: 'utf8' });
    const { data } = readString(csvText, { header: true });

    // 3. Save deck JSON so Practice screen can load it
    await AsyncStorage.setItem('deck', JSON.stringify(data));
    alert(`Loaded ${data.length} cards`);
  };

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={DECK_ASSETS}
      keyExtractor={item => item.name}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => loadDeck(item.file)}>
          <Text style={styles.title}>{item.name}</Text>
        </Pressable>
      )}
      ListHeaderComponent={<Text style={styles.h1}>Select a Deck</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  h1: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
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
