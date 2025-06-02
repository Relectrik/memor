// app/index.tsx
import { Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';   // let users open other routes

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Flashcards — Home</Text>

      {/* simple link to /practice (if you have that file) */}
      <Link href="/practice" style={styles.link}>
        Go to Practice ▶
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  h1: { fontSize: 24, marginBottom: 20 },
  link: { fontSize: 18, color: 'royalblue' },
});
