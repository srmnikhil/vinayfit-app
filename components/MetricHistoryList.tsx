import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

type HistoryEntry = {
  date: string;
  time: string;
  value: string;
};

type HistoryGroup = {
  label: string;
  value: string;
  expanded: boolean;
  entries: HistoryEntry[];
};

type MetricHistoryListProps = {
  data: HistoryGroup[];
};

export default function MetricHistoryList({ data }: MetricHistoryListProps) {
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>(
    data.reduce((acc, group) => ({
      ...acc,
      [group.label]: group.expanded
    }), {})
  );
  
  const toggleExpand = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };
  
  return (
    <View style={styles.container}>
      {data.map((group, index) => (
        <View key={index} style={styles.groupContainer}>
          <TouchableOpacity 
            style={styles.groupHeader}
            onPress={() => toggleExpand(group.label)}
          >
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.groupRight}>
              <Text style={styles.groupValue}>{group.value}</Text>
              {expandedGroups[group.label] ? (
                <ChevronUp size={16} color="#64748B" />
              ) : (
                <ChevronDown size={16} color="#64748B" />
              )}
            </View>
          </TouchableOpacity>
          
          {expandedGroups[group.label] && (
            <View style={styles.entriesContainer}>
              {group.entries.map((entry, entryIndex) => (
                <View key={entryIndex} style={styles.entryRow}>
                  <View style={styles.entryDateContainer}>
                    <Text style={styles.entryDate}>{entry.date}</Text>
                    <Text style={styles.entryTime}>{entry.time}</Text>
                  </View>
                  <Text style={styles.entryValue}>{entry.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  groupContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  groupLabel: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  groupRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  entriesContainer: {
    backgroundColor: '#F8FAFC',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  entryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 14,
    color: '#1E293B',
  },
  entryTime: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 8,
  },
  entryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
});