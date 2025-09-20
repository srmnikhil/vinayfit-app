import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { MediaItem, MediaComponentProps } from './types';
import { processMediaItem } from './mediaUtils';

const fileIcons: { [key: string]: string } = {
  'application/zip': 'folder-zip',
  'application/x-rar-compressed': 'folder-zip',
  'application/x-7z-compressed': 'folder-zip',
  'application/x-tar': 'folder-zip',
  'application/x-gzip': 'folder-zip',
  'application/json': 'code-json',
  'text/xml': 'code-tags',
  'text/html': 'language-html5',
  'text/css': 'language-css3',
  'text/javascript': 'language-javascript',
  'application/javascript': 'language-javascript',
};

const getFileIcon = (mimeType: string): string => {
  return fileIcons[mimeType] || 'file-document-outline';
};

const FileMedia: React.FC<MediaComponentProps> = ({
  onMediaSelect,
  onError,
  multiple = false,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['*/*'],
  colors = {
    primary: '#007AFF',
    background: '#fff',
    text: '#000',
    textSecondary: '#999',
    border: '#e1e1e1',
    error: '#FF3B30',
  },
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<MediaItem[]>([]);

  const pickFile = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes[0] === '*/*' ? undefined : allowedTypes,
        multiple,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const files = result.assets || [];
      
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            return await processMediaItem(
              { 
                uri: file.uri, 
                name: file.name || 'file',
                mimeType: file.mimeType || 'application/octet-stream',
                size: file.size || 0,
              },
              'file',
              { maxFileSize }
            );
          } catch (error) {
            console.error('Error processing file:', error);
            onError?.(error as Error);
            return null;
          }
        })
      );

      const validFiles = processedFiles.filter((file): file is MediaItem => file !== null);
      
      if (validFiles.length > 0) {
        const updatedFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
        setSelectedFiles(updatedFiles);
        onMediaSelect(multiple ? updatedFiles : validFiles[0]);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = selectedFiles.filter(file => file.id !== id);
    setSelectedFiles(updatedFiles);
    onMediaSelect(multiple ? updatedFiles : null);
  };

  const getFileIconColor = (mimeType: string) => {
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
      return '#FF9500';
    }
    if (mimeType.includes('json') || mimeType.includes('code') || mimeType.includes('text/')) {
      return '#34C759';
    }
    return colors.primary;
  };

  const formatFileName = (name: string, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const charsToKeep = maxLength - extension!.length - 4; // 4 for ...
    return `${nameWithoutExt.substring(0, charsToKeep)}...${extension}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {selectedFiles.length > 0 ? (
          <View style={styles.filesContainer}>
            {selectedFiles.map((file) => (
              <View key={file.id} style={[styles.fileItem, { borderColor: colors.border }]}>
                <View style={[styles.fileIconContainer, { backgroundColor: `${getFileIconColor(file.mimeType || '')}20` }]}>
                  <MaterialIcons 
                    name={getFileIcon(file.mimeType || '')} 
                    size={28} 
                    color={getFileIconColor(file.mimeType || '')} 
                  />
                </View>
                <View style={styles.fileInfo}>
                  <Text 
                    style={[styles.fileName, { color: colors.text }]} 
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {formatFileName(file.name)}
                  </Text>
                  <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
                    {formatFileSize(file.size || 0)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  onPress={() => removeFile(file.id)}
                >
                  <MaterialIcons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialIcons name="file-document-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              No files selected
            </Text>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              {allowedTypes[0] === '*/*' 
                ? 'All file types are allowed' 
                : `Allowed types: ${allowedTypes.join(', ')}`}
            </Text>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Max size: {maxFileSize / (1024 * 1024)}MB per file
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={pickFile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {multiple ? 'Select Files' : 'Select File'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Helper function to format file size in bytes to KB/MB
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  filesContainer: {
    width: '100%',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  fileIconContainer: {
    marginRight: 12,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  button: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FileMedia;
