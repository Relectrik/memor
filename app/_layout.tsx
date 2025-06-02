// app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: true,          // shows header bar
          drawerType: 'slide',
        }}
      >
        {/* every file in /app becomes a drawer item automatically */}
      </Drawer>
    </GestureHandlerRootView>
  );
}
