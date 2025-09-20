import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, FlatList, Platform, PermissionsAndroid } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { MediaItem, MediaComponentProps } from './types';
import { requestMediaPermissions } from './mediaUtils';

const PhotoMedia: React.FC<MediaComponentProps> = ({
  onMediaSelect,
  onError,
  maxSelection = 10,
  colors = {
    primary: '#007AFF',
    background: '#f8f9fa',
    text: '#000',
    textSecondary: '#6c757d',
    border: '#dee2e6',
    error: '#dc3545',
  },
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<MediaItem[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Request media library permissions
  useEffect(() => {
    let isMounted = true;
    
    const requestPermissions = async () => {
      try {
        await requestMediaPermissions('library');
        if (isMounted) {
          setHasPermission(true);
          // Don't automatically load gallery photos - wait for user action
        }
      } catch (error) {
        console.error('Error requesting media library permission:', error);
        if (isMounted) {
          setHasPermission(false);
          onError?.(error as Error);
        }
      }
    };

    requestPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const newPhoto: MediaItem = {
          id: `photo_${Date.now()}_0`,
          uri: result.assets[0].uri,
          type: 'image',
          name: `photo_${Date.now()}_0.jpg`,
          mimeType: 'image/jpeg',
          width: result.assets[0].width,
          height: result.assets[0].height,
          size: 0,
        };
        if (onMediaSelect) {
          onMediaSelect(newPhoto);
        }
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      onError?.(error as Error);
    }
  };

  const openImagePicker = async () => {
    try {
      setIsLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxSelection,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const newPhotos: MediaItem[] = result.assets.map((asset, index) => ({
          id: `photo_${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'image',
          name: `photo_${Date.now()}_${index}.jpg`,
          mimeType: 'image/jpeg',
          width: asset.width,
          height: asset.height,
          size: 0, // Will be updated after file info is retrieved
        }));

        // Automatically select and send the photos
        if (onMediaSelect) {
          newPhotos.forEach(photo => onMediaSelect(photo));
        }
      }
    } catch (error) {
      console.error('Error opening image picker:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhotoSelection = (photo: MediaItem) => {
    setSelectedPhotos(prev => {
      const isSelected = prev.some(item => item.id === photo.id);
      
      if (isSelected) {
        return prev.filter(item => item.id !== photo.id);
      } else if (prev.length < maxSelection) {
        return [...prev, photo];
      } else {
        // Show error or alert that max selection reached
        onError?.(new Error(`You can select up to ${maxSelection} photos`));
        return prev;
      }
    });
  };

  const handleDone = () => {
    if (selectedPhotos.length > 0 && onMediaSelect) {
      onMediaSelect(selectedPhotos);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Requesting media library permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} style={{ marginBottom: 16 }} />
        <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 16, fontSize: 16 }}>
          No access to media library. Please enable media library permissions in your device settings.
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={async () => {
            try {
              await requestMediaPermissions('library');
              setHasPermission(true);
            } catch (error) {
              onError?.(error as Error);
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.text }}>Opening gallery...</Text>
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <MaterialIcons name="photo-library" size={64} color={colors.primary} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Select Photos
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
            Choose photos from your gallery to share
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }]}
            onPress={openImagePicker}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Open Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }]}
            onPress={openCamera}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  galleryContainer: {
    padding: 2,
  },
  photoContainer: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoMedia;
