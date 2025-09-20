import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Lock, Bell,Target, Smartphone, CircleHelp as HelpCircle, Play, Info, LogOut, ChevronRight } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useUserRole } from '@/contexts/UserContext';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  // const { userName, setUserRole } = useUserRole();
  const { userRole, userName, setUserRole } = useUserRole();

  const handleLogout = () => {
    setUserRole(null);
    router.replace('/(auth)/login');
  };

  const settingsItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: User,
      onPress: () => router.push('/profile-settings'),
      showAvatar: true,
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: Lock,
      onPress: () => router.push('/change-password'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      onPress: () => router.push('/notification-settings'),
    },

       ...(userRole === 'client' ? [{
          id: 'walkthrough',
      title: 'Watch Everfit app Walkthrough',
      icon: Play,
      onPress: () => router.push('/app-walkthrough'),
        }] : []),

        ...(userRole === 'client' ? [{
          id: 'question',
      title: 'Ask us a question',
      icon: HelpCircle,
      onPress: () => router.push('/support'),
        }] : []),
    
        ...(userRole === 'client' ? [{
          id: 'integrations',
          title: 'App Integrations',
          icon: Smartphone,
          color: colors.info,
          onPress: () => router.push('/app-integrations'),
        }] : []),
  
    {
      id: 'about',
      title: 'About',
      icon: Info,
      onPress: () => router.push('/about'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Settings Items */}
        {settingsItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.settingItem}
              onPress={item.onPress}
            >
              <View style={styles.settingLeft}>
                {item.showAvatar ? (
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>VD</Text>
                  </View>
                ) : (
                  <View style={styles.iconContainer}>
                    <IconComponent size={20} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.settingTitle}>{item.title}</Text>
              </View>
              <ChevronRight size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}

        {/* Logout Button */}
        {/* <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity> */}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 32,
  },
  logoutText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.error,
  },
});