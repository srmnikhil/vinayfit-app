import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme, getColors } from '../../../hooks/useColorScheme';
import ClientMealView from '../../../components/nutrition/ClientMealView';

export default function ClientNutritionScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const { id, name } = useLocalSearchParams();
  
  const clientId = typeof id === 'string' ? id : '';
  const clientName = typeof name === 'string' ? decodeURIComponent(name) : 'Client';

  if (!clientId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Client not found</Text>
      </View>
    );
  }

  return <ClientMealView clientId={clientId} clientName={clientName} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
});