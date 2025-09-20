import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface RadioGroupProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  label?: string;
  horizontal?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ options, selected, onSelect, label, horizontal = true }) => {
  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 dark:text-gray-300 mb-2">{label}</Text>}
      <View className={horizontal ? 'flex-row space-x-4' : 'flex-col space-y-2'}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            className="flex-row items-center mr-2"
            onPress={() => onSelect(opt)}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 border-gray-400 justify-center items-center ${
                selected === opt ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-gray-800'
              }`}
            />
            <Text className="ml-2 text-gray-900 dark:text-white">{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default RadioGroup;
