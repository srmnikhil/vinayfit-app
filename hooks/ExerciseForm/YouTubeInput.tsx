import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ExternalLink, X } from 'lucide-react-native';
import { extractYouTubeVideoId, getYouTubeThumbnail, validateYouTubeUrl } from '@/utils/videoUtils';

interface YouTubeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onThumbnailExtracted: (thumbnailUrl: string) => void;
  colors: any;
}

export function YouTubeInput({ value, onChangeText, onThumbnailExtracted, colors }: YouTubeInputProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  const styles = createStyles(colors);

  useEffect(() => {
    if (value) {
      const isValid = validateYouTubeUrl(value);
      setIsValidUrl(isValid);
      
      if (isValid) {
        const videoId = extractYouTubeVideoId(value);
        if (videoId) {
          const thumbnail = getYouTubeThumbnail(videoId, 'high');
          setThumbnailUrl(thumbnail);
          onThumbnailExtracted(thumbnail);
        }
      } else {
        setThumbnailUrl('');
        onThumbnailExtracted('');
      }
    } else {
      setThumbnailUrl('');
      setIsValidUrl(true);
    }
  }, [value]);

  const handleClear = () => {
    onChangeText('');
    setThumbnailUrl('');
    onThumbnailExtracted('');
  };

  const openYouTube = () => {
    if (value && isValidUrl) {
      // You can implement opening the YouTube link here
      console.log('Opening YouTube:', value);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>YouTube Video URL</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            !isValidUrl && styles.invalidInput
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder="https://www.youtube.com/watch?v=..."
          placeholderTextColor={colors.textTertiary}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {value && (
          <View style={styles.inputActions}>
            {isValidUrl && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openYouTube}
              >
                <ExternalLink size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClear}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {!isValidUrl && value && (
        <Text style={styles.errorText}>
          Please enter a valid YouTube URL
        </Text>
      )}
      
      {thumbnailUrl && (
        <View style={styles.thumbnailPreview}>
          <Text style={styles.thumbnailLabel}>Auto-generated thumbnail:</Text>
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        </View>
      )}
      
      <Text style={styles.hint}>
        Paste a YouTube video URL to automatically extract the thumbnail
      </Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 80,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  invalidInput: {
    borderColor: colors.error,
  },
  inputActions: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  thumbnailPreview: {
    marginTop: 12,
  },
  thumbnailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  thumbnail: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
});