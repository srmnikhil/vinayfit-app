import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { MediaItem, MediaComponentProps } from './types';
import { processMediaItem } from './mediaUtils';

const documentIcons: { [key: string]: string } = {
  'application/pdf': 'picture-as-pdf',
  'application/msword': 'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/vnd.ms-excel': 'excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/vnd.ms-powerpoint': 'powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'powerpoint',
  'text/plain': 'insert-drive-file',
};

const getDocumentIcon = (mimeType: string): string => {
  return documentIcons[mimeType] || 'insert-drive-file';
};

const DocumentMedia: React.FC<MediaComponentProps> = ({
  onMediaSelect,
  onError,
  multiple = false,
  maxFileSize = 25 * 1024 * 1024, // 25MB default
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
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
  const [selectedDocuments, setSelectedDocuments] = useState<MediaItem[]>([]);

  const pickDocument = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes.join(','),
        multiple,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const documents = result.assets || [];
      
      // Process each selected document
      const processedDocs = await Promise.all(
        documents.map(async (doc) => {
          try {
            const mediaItem = await processMediaItem(
              { 
                uri: doc.uri, 
                name: doc.name,
                mimeType: doc.mimeType || 'application/octet-stream',
                size: doc.size || 0,
              },
              'document',
              { maxFileSize }
            );
            
            return mediaItem;
          } catch (error) {
            console.error('Error processing document:', error);
            onError?.(error as Error);
            return null;
          }
        })
      );

      // Filter out any null values from failed processing
      const validDocs = processedDocs.filter((doc): doc is MediaItem => doc !== null);
      
      if (validDocs.length > 0) {
        if (multiple) {
          setSelectedDocuments(prev => [...prev, ...validDocs]);
          onMediaSelect(validDocs[0]); // For now, just send the first one
        } else {
          setSelectedDocuments(validDocs);
          onMediaSelect(validDocs[0]);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = (id: string) => {
    setSelectedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getFileIconColor = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '#FF3B30';
    if (mimeType.includes('word')) return '#2B579A';
    if (mimeType.includes('excel')) return '#217346';
    if (mimeType.includes('powerpoint')) return '#D24726';
    return colors.primary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {selectedDocuments.length > 0 ? (
          <View style={styles.documentsContainer}>
            {selectedDocuments.map((doc) => (
              <View key={doc.id} style={[styles.documentItem, { borderColor: colors.border }]}>
                <View style={styles.documentIconContainer}>
                  <MaterialIcons 
                    name={getDocumentIcon(doc.mimeType || '')} 
                    size={32} 
                    color={getFileIconColor(doc.mimeType || '')} 
                  />
                </View>
                <View style={styles.documentInfo}>
                  <Text 
                    style={[styles.documentName, { color: colors.text }]} 
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {doc.name}
                  </Text>
                  <Text style={[styles.documentSize, { color: colors.textSecondary }]}>
                    {formatFileSize(doc.size || 0)}
                  </Text>
                  <Text style={[styles.documentType, { color: colors.textSecondary }]}>
                    {doc.mimeType?.split('/').pop()?.toUpperCase() || 'FILE'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                  onPress={() => removeDocument(doc.id)}
                >
                  <MaterialIcons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialIcons name="insert-drive-file" size={64} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              No documents selected
            </Text>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
            </Text>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Max size: {maxFileSize / (1024 * 1024)}MB per file
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={pickDocument}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {multiple ? 'Select Documents' : 'Select Document'}
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
  documentsContainer: {
    width: '100%',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  documentIconContainer: {
    marginRight: 12,
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    marginBottom: 2,
  },
  documentType: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

export default DocumentMedia;
