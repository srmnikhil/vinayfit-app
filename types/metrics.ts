export interface MetricEntry {
  id: string;
  value: number;
  unit: string;
  date: string;
  time: string;
}

export interface Metric {
  id: string;
  name: string;
  unit: string;
  icon: string;
  color: string;
  currentValue?: number;
  lastUpdated?: string;
  entries: MetricEntry[];
}

export type MetricType = 
  | 'weight'
  | 'chest'
  | 'shoulders'
  | 'waist'
  | 'thigh'
  | 'hip'
  | 'bodyFat'
  | 'bicep'
  | 'waterIntake'
  | 'steps';

export type TimeRange = '1W' | '1M' | '2M' | '1Y';

export interface MetricData {
  [key: string]: Metric;
}