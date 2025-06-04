// app/upload.tsx
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { readString } from "react-papaparse";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const DECK_ASSETS = [
  {
    name: "Intro Concurrency",
    file: require("../assets/decks/intro_concurrency_100_flashcards.csv"),
  },
  {
    name: "CA DMV Test",
    file: require("../assets/decks/ca_dmv_permit_flashcards.csv"),
  },
] as const;

export const unstable_settings = { headerShown: false };

export default function Upload() {
  const [loadingDeck, setLoadingDeck] = React.useState<string | null>(null);
  const router = useRouter();

  const loadDeck = async (assetModule: number, deckName: string) => {
    try {
      setLoadingDeck(deckName);
      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const csvText = await FileSystem.readAsStringAsync(uri!, {
        encoding: "utf8",
      });
      const { data } = readString(csvText, { header: true });
      await AsyncStorage.setItem("deck", JSON.stringify(data));
      alert(`✅ Loaded ${deckName} (${data.length} cards)`);
      router.replace("/"); // go back Home or directly to Practice if you prefer
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load deck. Try again.");
    } finally {
      setLoadingDeck(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>📥 Select a Deck</Text>
      <FlatList
        data={DECK_ASSETS}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.deckCard,
              loadingDeck === item.name && styles.deckCardLoading,
            ]}
            onPress={() => loadDeck(item.file, item.name)}
            disabled={!!loadingDeck}
          >
            {loadingDeck === item.name ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.deckName}>{item.name}</Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 20,
    textAlign: "center",
  },
  deckCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  deckCardLoading: {
    backgroundColor: "#E0EFFF",
  },
  deckName: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
  },
});
