import { ImageSourcePropType } from 'react-native';

export type MediaType = 'image' | 'video' | 'document' | 'camera' | 'file';

export interface MediaItem {
  id: string;
  uri: string;
  type: MediaType;
  name?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  mimeType?: string;
  createdAt?: string;
  url?: string;
  width?: number;
  height?: number;
}

export interface MediaComponentProps {
  onMediaSelect?: (media: MediaItem | MediaItem[]) => void;
  onMediaSelected?: (media: MediaItem | MediaItem[]) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  multiple?: boolean;
  maxSelection?: number;
  colors?: {
    primary: string;
    background: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
  };
}

export interface MediaPickerOptions {
  mediaTypes?: 'photo' | 'video' | 'all';
  allowsEditing?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  videoQuality?: 'low' | 'medium' | 'high';
  durationLimit?: number;
  selectionLimit?: number;
}
