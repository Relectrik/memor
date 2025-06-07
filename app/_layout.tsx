// app/_layout.tsx
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Color schemes for tab bar
const getTabBarColors = (isDark: boolean) => ({
  background: isDark ? '#1c89ff' : '#ffffff',
  border: isDark ? '#2c2c2e' : '#e9ecef',
  activeTint: '#FFFFFF',
  inactiveTint: isDark ? '#000000' : '#8E8E93',
});

// Custom tab bar background with blur gradient effect
const TabBarBackground = ({ isDark }: { isDark: boolean }) => (
  <View style={{
    position: 'absolute',
    top: -40,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 45,
    overflow: 'hidden',
  }}>
    {/* Masked blur to fade intensity from center to edges */}
    <MaskedView
      style={{ flex: 1 }}
      maskElement={
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.3)',
            'rgba(255, 255, 255, 0.3)',
            'rgba(255, 255, 255, 0.3)',
            'transparent'
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={{
            flex: 1,
            borderRadius: 45,
          }}
        />
      }
    >
      <BlurView
        intensity={isDark ? 50 : 40}
        tint={isDark ? 'dark' : 'light'}
        style={{
          flex: 1,
          borderRadius: 45,
        }}
      />
    </MaskedView>
    
    {/* Central island */}
    <View style={{
      position: 'absolute',
      top: 40,
      left: 20,
      right: 20,
      bottom: 20,
      backgroundColor: isDark ? 'rgba(28, 137, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: 25,
    }} />
  </View>
);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tabColors = getTabBarColors(isDark);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tabs
        screenOptions={{
          tabBarBackground: () => <TabBarBackground isDark={isDark} />,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            position: 'absolute',
            borderTopWidth: 0,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            marginHorizontal: 20,
            marginBottom: 20,
            marginTop: 15,
            borderRadius: 25,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 15,
            elevation: 8,
          },
          tabBarActiveTintColor: tabColors.activeTint,
          tabBarInactiveTintColor: tabColors.inactiveTint,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size || 24, color }}>🏠</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            title: 'Practice',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size || 24, color }}>▶️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size || 24, color }}>➕</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size || 24, color }}>⚙️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from tabs
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            href: null, // Hide old upload from tabs
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
