import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  multiline?: boolean;
  numberOfLines?: number;
  type?: 'text' | 'picker';
  onPress?: () => void;
  colors: any;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  hint,
  multiline = false,
  numberOfLines = 1,
  type = 'text',
  onPress,
  colors,
}: FormFieldProps) {
  const styles = createStyles(colors);

  if (type === 'picker') {
    return (
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TouchableOpacity style={styles.picker} onPress={onPress}>
          <Text style={[
            styles.pickerText,
            !value && styles.placeholderText
          ]}>
            {value || placeholder}
          </Text>
          <ChevronDown size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  fieldHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
});