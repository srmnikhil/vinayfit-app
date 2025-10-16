import React from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoaderProps {
  size?: number;
  label: string;
}

export default function Loader({ size = 350, label }: LoaderProps) {
  return (
    <View className="flex-1 justify-center items-center dark:bg-appBackground">
      <LottieView
        source={require('../assets/loading.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
      <Text className='text-2xl font-bold italic dark:text-textSecondary'>{label}</Text>
    </View>
  );
}
