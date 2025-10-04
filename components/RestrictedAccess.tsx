import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';

interface RestrictedAccessProps {
  message?: string;
}

export default function RestrictedAccess({ message }: RestrictedAccessProps) {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme ?? 'light');

  useEffect(() => {
    Alert.alert('Access Denied', message || 'You do not have access to this feature.');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {message || 'Access restricted for your role.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
