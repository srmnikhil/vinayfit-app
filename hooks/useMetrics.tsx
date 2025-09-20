import { useState } from 'react';

export type Metric = {
  current: number;
  change?: number;
  lastUpdated?: Date;
};

export type MetricDetails = {
  name: string;
  unit: string;
  current: number;
  change?: number;
  history?: { date: string; value: number }[];
};

export type Metrics = {
  weight: Metric;
  chest: Metric;
  shoulders: Metric;
  waist: Metric;
  thigh: Metric;
  hip: Metric;
  bodyFat: Metric;
  bicep: Metric;
  waterIntake: Metric;
  steps: Metric;
};

// Initial mock data
const initialMetrics: Metrics = {
  weight: { current: 58, change: 6, lastUpdated: new Date() },
  chest: { current: 36, lastUpdated: new Date() },
  shoulders: { current: 40 },
  waist: { current: 32 },
  thigh: { current: 22 },
  hip: { current: 36 },
  bodyFat: { current: 15, change: -2 },
  bicep: { current: 13 },
  waterIntake: { current: 64 },
  steps: { current: 8456, change: 1245 },
};

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  
  const logMetric = (metricName: keyof Metrics, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [metricName]: {
        ...prev[metricName],
        current: value,
        lastUpdated: new Date()
      }
    }));
  };
  
  const getMetricDetails = (metricKey?: string): MetricDetails | null => {
    if (!metricKey) return null;
    
    const key = metricKey.replace(/-/g, '') as keyof Metrics;
    const metric = metrics[key];
    
    if (!metric) return null;
    
    const details: Record<string, MetricDetails> = {
      weight: { 
        name: 'Weight', 
        unit: 'kg', 
        current: metric.current,
        change: metric.change
      },
      chest: { 
        name: 'Chest', 
        unit: 'in', 
        current: metric.current
      },
      shoulders: { 
        name: 'Shoulders', 
        unit: 'in', 
        current: metric.current
      },
      waist: { 
        name: 'Waist', 
        unit: 'in', 
        current: metric.current
      },
      thigh: { 
        name: 'Thigh', 
        unit: 'in', 
        current: metric.current
      },
      hip: { 
        name: 'Hip', 
        unit: 'in', 
        current: metric.current
      },
      bodyfat: { 
        name: 'Body Fat', 
        unit: '%', 
        current: metric.current,
        change: metric.change
      },
      bicep: { 
        name: 'Bicep', 
        unit: 'in', 
        current: metric.current
      },
      waterintake: { 
        name: 'Water Intake', 
        unit: 'oz', 
        current: metric.current
      },
      steps: { 
        name: 'Steps', 
        unit: '', 
        current: metric.current,
        change: metric.change
      },
    };
    
    return details[key] || null;
  };
  
  return {
    metrics,
    logMetric,
    getMetricDetails,
  };
}