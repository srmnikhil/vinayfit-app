import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSessionStatusColor, formatSessionStatus } from '@/utils/sessionUtils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'compact' | 'outlined';
  customColors?: {
    background?: string;
    text?: string;
  };
}

export default function StatusBadge({ 
  status, 
  variant = 'default',
  customColors 
}: StatusBadgeProps) {
  const backgroundColor = customColors?.background || getSessionStatusColor(status);
  const textColor = customColors?.text || '#FFFFFF';
  const displayText = formatSessionStatus(status);

  const badgeStyles = [
    styles.badge,
    variant === 'compact' && styles.badgeCompact,
    variant === 'outlined' && styles.badgeOutlined,
    { backgroundColor: variant === 'outlined' ? 'transparent' : backgroundColor },
    variant === 'outlined' && { borderColor: backgroundColor },
  ];

  const textStyles = [
    styles.badgeText,
    variant === 'compact' && styles.badgeTextCompact,
    { color: variant === 'outlined' ? backgroundColor : textColor },
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{displayText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    borderRadius: 8,
  },
  badgeOutlined: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  badgeTextCompact: {
    fontSize: 10,
  },
});
