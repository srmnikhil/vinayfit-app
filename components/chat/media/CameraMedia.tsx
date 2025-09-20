import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface CameraMediaProps {
  onMediaSelect: (uri: string) => void;
  onError?: (error: string) => void;
  colors?: {
    primary: string;
    background: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
  };
}

const CameraMedia: React.FC<CameraMediaProps> = ({
  onMediaSelect,
  onError,
  colors = {
    primary: '#007AFF',
    background: '#000',
    text: '#fff',
    textSecondary: '#999',
    border: '#333',
    error: '#FF3B30',
  },
}) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Initialize camera permissions on mount
  React.useEffect(() => {
    (async () => {
      if (!permission) {
        await requestPermission();
      }
    })();
  }, []);

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to take photos');
        return;
      }
    }
    setShowCamera(true);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onMediaSelect(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      onError?.('Failed to pick image');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        onMediaSelect(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        onError?.('Failed to take picture');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hasCameraPermission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.permissionText, { color: colors.text, marginBottom: 20 }]}>
          We need camera permission to take photos
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestCameraPermission}
        >
          <Text style={[styles.permissionButtonText, { color: colors.background }]}>
            Grant Camera Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        onCameraReady={onCameraReady}
      >
        <View style={styles.controlsContainer}>
          <View style={styles.topControls}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={toggleCameraType}
              disabled={!isCameraReady}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={[styles.captureButton, { borderColor: colors.primary }]}
              onPress={takePicture}
              disabled={!isCameraReady}
            >
              <View style={[styles.captureButtonInner, { backgroundColor: colors.primary }]} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraMedia;