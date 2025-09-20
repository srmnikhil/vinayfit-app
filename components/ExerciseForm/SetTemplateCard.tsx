import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CreditCard as Edit3, Trash2 } from 'lucide-react-native';

interface SetTemplate {
  id: string;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

interface SetTemplateCardProps {
  set: SetTemplate;
  index: number;
  onEdit: (set: SetTemplate) => void;
  onRemove: (setId: string) => void;
  canRemove: boolean;
  colors: any;
}

export function SetTemplateCard({
  set,
  index,
  onEdit,
  onRemove,
  canRemove,
  colors,
}: SetTemplateCardProps) {
  const styles = createStyles(colors);

  const formatSetDetails = () => {
    const parts = [];
    if (set.reps) parts.push(`${set.reps} reps`);
    if (set.duration) parts.push(`${set.duration}s`);
    if (set.weight) parts.push(`@ ${set.weight}kg`);
    if (set.restTime) parts.push(`Rest: ${set.restTime}s`);
    return parts.join(' • ');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.title}>Set {index + 1}</Text>
          <Text style={styles.details}>{formatSetDetails()}</Text>
          {set.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {set.notes}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(set)}
          >
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          {canRemove && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onRemove(set.id)}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  details: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notes: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});