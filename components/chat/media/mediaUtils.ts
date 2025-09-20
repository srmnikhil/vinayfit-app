import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MediaItem, MediaType, MediaPickerOptions } from './types';

// Request necessary permissions for media access
export const requestMediaPermissions = async (mediaType: 'camera' | 'library' | 'both' = 'both') => {
  try {
    if (mediaType === 'camera' || mediaType === 'both') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        throw new Error('Camera permission not granted');
      }
    }
    
    if (mediaType === 'library' || mediaType === 'both') {
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          throw new Error('Media library permission not granted');
        }
      }
    }
    
    return { status: 'granted' };
  } catch (error) {
    console.error('Error requesting media permissions:', error);
    throw error;
  }
};

// Get file info (size, mimeType, etc.)
export const getFileInfo = async (uri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Get file extension
    const fileExtension = uri.split('.').pop()?.toLowerCase() || '';
    
    // Determine MIME type based on extension
    let mimeType = 'application/octet-stream';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];
    
    if (imageExtensions.includes(fileExtension)) {
      mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    } else if (videoExtensions.includes(fileExtension)) {
      mimeType = `video/${fileExtension}`;
    } else if (fileExtension === 'pdf') {
      mimeType = 'application/pdf';
    } else if (['doc', 'docx'].includes(fileExtension)) {
      mimeType = 'application/msword';
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
      mimeType = 'application/vnd.ms-excel';
    }
    
    return {
      size: fileInfo.size || 0,
      mimeType,
      name: uri.split('/').pop() || `file.${fileExtension}`,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
};

// Process selected media item
export const processMediaItem = async (
  result: any, 
  type: MediaType,
  options: MediaPickerOptions = {}
): Promise<MediaItem> => {
  try {
    if (result.cancelled) {
      throw new Error('Media selection was cancelled');
    }

    let uri = result.uri || result.assets?.[0]?.uri;
    if (!uri) {
      throw new Error('No media URI found');
    }

    // On iOS, the URI might be prefixed with 'file://'
    if (uri.startsWith('file://')) {
      uri = uri.replace('file://', '');
    }

    // Get file info
    const fileInfo = await getFileInfo(uri);
    
    // Check file size if maxFileSize is provided
    if (options.maxFileSize && fileInfo.size > options.maxFileSize) {
      throw new Error(`File size exceeds the maximum limit of ${options.maxFileSize / (1024 * 1024)}MB`);
    }

    // For videos, get duration if available
    let duration: number | undefined;
    if (type === 'video' && result.duration) {
      duration = result.duration;
    }

    // For images, get dimensions if available
    let width, height;
    if (type === 'image' && result.width && result.height) {
      width = result.width;
      height = result.height;
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uri,
      type,
      name: fileInfo.name,
      size: fileInfo.size,
      duration,
      mimeType: fileInfo.mimeType,
      ...(width && height ? { width, height } : {}),
    };
  } catch (error) {
    console.error('Error processing media item:', error);
    throw error;
  }
};

// Validate file type
export const validateFileType = (uri: string, allowedTypes: string[] = []): boolean => {
  if (allowedTypes.length === 0) return true;
  
  const fileExtension = uri.split('.').pop()?.toLowerCase() || '';
  const mimeType = getMimeType(uri);
  
  return allowedTypes.some(type => 
    type.toLowerCase() === `.${fileExtension}` || 
    type.toLowerCase() === mimeType
  );
};

// Get MIME type from URI
const getMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
};
