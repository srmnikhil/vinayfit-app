import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

export function OptionChip({ label, selected, onPress, colors }: OptionChipProps) {
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selectedChip]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>
        {label}
      </Text>
      {selected && (
        <X size={14} color="#FFFFFF" style={styles.removeIcon} />
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  removeIcon: {
    marginLeft: 6,
  },
});