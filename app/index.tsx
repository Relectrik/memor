// app/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const unstable_settings = {
  headerShown: false, // hide header here, too
};

export default function Home() {
  const router = useRouter();
  const [deckLoaded, setDeckLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if there’s already a deck in AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("deck").then((json) => {
      setDeckLoaded(!!json);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Flashcards</Text>
      <Text style={styles.subtitle}>
        Learn on the go—swipe right if you got it, left if you need more practice.
      </Text>

      <Pressable
        style={[styles.button, styles.loadButton]}
        onPress={() => router.push("/upload")}
      >
        <Text style={styles.buttonText}>📥 Load a Deck</Text>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          deckLoaded ? styles.practiceButton : styles.practiceButtonDisabled,
        ]}
        onPress={() => {
          if (deckLoaded) router.push("/practice");
        }}
        disabled={!deckLoaded}
      >
        <Text
          style={[
            styles.buttonText,
            !deckLoaded && { color: "#999999" },
          ]}
        >
          ▶ Practice
        </Text>
      </Pressable>

      {!deckLoaded && (
        <Text style={styles.hintText}>
          (Tap “Load a Deck” first to start practicing.)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centered: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 8,
    color: "#111111",
  },
  subtitle: {
    fontSize: 16,
    color: "#444444",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  button: {
    width: "80%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  loadButton: {
    backgroundColor: "#FFFFFF",
  },
  practiceButton: {
    backgroundColor: "#007AFF",
  },
  practiceButtonDisabled: {
    backgroundColor: "#DDDDDD",
  },
  buttonText: {
    fontSize: 18,
    color: "#1F1F21",
    fontWeight: "600",
  },
  hintText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888888",
  },
});
