import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SettingItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  action?: () => void;
  showArrow?: boolean;
};

const PROFILE_SETTINGS: SettingItem[] = [
  { id: '1', title: 'Account', subtitle: 'Manage your profile', icon: '👤', showArrow: true },
  { id: '2', title: 'Sync & Backup', subtitle: 'Cloud synchronization', icon: '☁️', showArrow: true },
  { id: '3', title: 'Statistics', subtitle: 'View your progress', icon: '📊', showArrow: true },
];

const APP_SETTINGS: SettingItem[] = [
  { id: '4', title: 'Study Settings', subtitle: 'Card intervals & difficulty', icon: '⚡', showArrow: true },
  { id: '5', title: 'Notifications', subtitle: 'Study reminders', icon: '🔔', showArrow: true },
  { id: '6', title: 'Appearance', subtitle: 'Theme & display', icon: '🎨', showArrow: true },
  { id: '7', title: 'Haptic Feedback', subtitle: 'Vibration settings', icon: '📳', showArrow: true },
  { id: '8', title: 'Audio', subtitle: 'Sound effects', icon: '🔊', showArrow: true },
];

const SUPPORT_SETTINGS: SettingItem[] = [
  { id: '9', title: 'Help & Support', subtitle: 'Get assistance', icon: '❓', showArrow: true },
  { id: '10', title: 'Privacy Policy', subtitle: 'How we protect your data', icon: '🔒', showArrow: true },
  { id: '11', title: 'Terms of Service', subtitle: 'Usage terms', icon: '📄', showArrow: true },
  { id: '12', title: 'Rate App', subtitle: 'Share your feedback', icon: '⭐', showArrow: true },
];

// Color schemes
const getColors = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#f8f9fa',
  cardBackground: isDark ? '#1c1c1e' : '#ffffff',
  text: isDark ? '#ffffff' : '#000000',
  secondaryText: isDark ? '#8e8e93' : '#666666',
  brand: '#007AFF',
  iconBackground: isDark ? '#2c2c2e' : '#f8f9fa',
  border: isDark ? '#2c2c2e' : '#f0f0f0',
  arrow: isDark ? '#48484a' : '#ccc',
  destructive: '#FF3B30',
});

export default function Settings() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const handleSettingPress = (item: SettingItem) => {
    console.log(`Pressed: ${item.title}`);
    // Add navigation or action logic here later
  };

  const renderSettingItem = (item: SettingItem) => (
    <Pressable
      key={item.id}
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSettingPress(item)}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.secondaryText }]}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.showArrow && (
        <Text style={[styles.arrow, { color: colors.arrow }]}>›</Text>
      )}
    </Pressable>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.cardBackground }]}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.profileInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.profileName, { color: colors.text }]}>John Doe</Text>
              <Text style={[styles.profileEmail, { color: colors.secondaryText }]}>john.doe@example.com</Text>
            </View>
          </View>
          <Pressable style={[styles.editButton, { borderColor: colors.brand }]}>
            <Text style={[styles.editButtonText, { color: colors.brand }]}>Edit</Text>
          </Pressable>
        </View>

        {/* Settings Sections */}
        {renderSection('Account', PROFILE_SETTINGS)}
        {renderSection('Study', APP_SETTINGS)}
        {renderSection('Support', SUPPORT_SETTINGS)}

        {/* Sign Out Button */}
        <Pressable style={[styles.signOutButton, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>

        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.secondaryText , marginBottom: 40}]}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  signOutButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
  },
}); 