import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  label?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, label }) => {
  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 dark:text-gray-300 mb-2">{label}</Text>}
      <View className="flex-row flex-wrap">
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggleOption(opt)}
            className={`px-3 py-1 mr-2 mb-2 rounded-full border ${
              selected.includes(opt)
                ? 'bg-blue-500 border-blue-500'
                : 'border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <Text
              className={`text-sm ${
                selected.includes(opt) ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default MultiSelect;
