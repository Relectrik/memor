import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { readString } from 'react-papaparse';

type DeckInfo = {
  id: string;
  name: string;
  cardCount: number;
  progress: number;
  color: string;
};

const DECK_ASSETS = [
  { name: 'Spanish', file: require('../assets/decks/intro_concurrency_100_flashcards.csv'), color: '#007AFF' },
  { name: 'Biology', file: require('../assets/decks/ca_dmv_permit_flashcards.csv'), color: '#34C759' },
] as const;

// Mock data for demonstration
const MOCK_DECKS: DeckInfo[] = [
  { id: '1', name: 'Spanish', cardCount: 30, progress: 60, color: '#007AFF' },
  { id: '2', name: 'Biology', cardCount: 25, progress: 36, color: '#34C759' },
  { id: '3', name: 'Geography', cardCount: 20, progress: 80, color: '#FF9500' },
  { id: '4', name: 'Art History', cardCount: 16, progress: 25, color: '#AF52DE' },
];

// Color schemes
const getColors = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#f8f9fa',
  cardBackground: isDark ? '#1c1c1e' : '#ffffff',
  text: isDark ? '#ffffff' : '#000000',
  secondaryText: isDark ? '#8e8e93' : '#666666',
  brand: '#007AFF',
  progressBackground: isDark ? '#2c2c2e' : '#E5E5EA',
});

export default function Home() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const [decks, setDecks] = useState<DeckInfo[]>(MOCK_DECKS);

  const loadDeck = async (assetModule: number, deckName: string) => {
    try {
      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;

      const csvText = await FileSystem.readAsStringAsync(uri!, { encoding: 'utf8' });
      const result = await new Promise<any>((resolve) => {
        readString(csvText, {
          header: true,
          complete: (results) => resolve(results)
        });
      });
      const data = result.data;

      await AsyncStorage.setItem('deck', JSON.stringify(data));
      await AsyncStorage.setItem('currentDeckName', deckName);
      
      // You could navigate to practice here if desired
      // router.push('/practice');
    } catch (error) {
      console.error('Error loading deck:', error);
    }
  };

  const renderDeckCard = ({ item }: { item: DeckInfo }) => (
    <Pressable 
      style={[styles.deckCard, { backgroundColor: colors.cardBackground }]} 
      onPress={() => {
        // Find the corresponding asset for real decks
        const asset = DECK_ASSETS.find(a => a.name === item.name);
        if (asset) {
          loadDeck(asset.file, item.name);
        }
      }}
    >
      <View style={styles.deckHeader}>
        <Text style={[styles.deckTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.progressText, { color: colors.secondaryText }]}>{item.progress}%</Text>
      </View>
      
      <Text style={[styles.cardCount, { color: colors.secondaryText }]}>{item.cardCount} cards</Text>
      
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.progressBackground }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${item.progress}%`,
                backgroundColor: item.color 
              }
            ]} 
          />
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header with branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: colors.brand }]}>
              <Text style={styles.logoText}>🧠</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.brand }]}>memor</Text>
          </View>
        </View>

        {/* Decks section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Decks</Text>
        
        <FlatList
          data={decks}
          keyExtractor={item => item.id}
          renderItem={renderDeckCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.decksList}
        />
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
  header: {
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  decksList: {
    paddingBottom: 20,
  },
  deckCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deckTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardCount: {
    fontSize: 16,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
}); 