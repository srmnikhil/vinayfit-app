// components/VoiceRecorder/index.ts
export { default as VoiceRecorder } from './VoiceRecorder';
export { default as VoicePlayer } from './VoicePlayer';

// Export types for use in other components
export interface AudioData {
  uri: string;
  duration: number;
  size: number;
  name: string;
  type: string;
}

export interface Colors {
  primary: string;
  background: string;
  text: string;
  textSecondary: string;
  error: string;
  border: string;
}