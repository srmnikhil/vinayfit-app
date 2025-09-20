import { useEffect, useState, useRef } from 'react';
import { Pedometer } from 'expo-sensors';

export function useExpoStepCounter() {
  const [stepCount, setStepCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [stepOffset, setStepOffset] = useState(0);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    Pedometer.isAvailableAsync().then(setIsAvailable);
    subscriptionRef.current = Pedometer.watchStepCount(result => {
      setStepCount(result.steps);
    });
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
    };
  }, []);

  // stepsSinceGoal is the steps since the last goal reset
  const stepsSinceGoal = stepCount - stepOffset;

  return { stepCount, isAvailable, stepOffset, setStepOffset, stepsSinceGoal };
} 