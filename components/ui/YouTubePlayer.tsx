import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Linking } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
  video_url: string;
  height?: number;
  autoplay?: boolean;
  showControls?: boolean;
  maintainAspectRatio?: boolean;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const getAspectRatioHeight = (width: number) => {
  return (width * 9) / 16;
};

const YouTubePlayerComponent: React.FC<YouTubePlayerProps> = ({
  video_url,
  height,
  autoplay = false,
  showControls = true,
  maintainAspectRatio = false,
  onLoadStart,
  onLoadEnd,
  onError,
}) => {
  const [playing, setPlaying] = useState(autoplay);
  const [error, setError] = useState(false);

  const videoId = getYouTubeVideoId(video_url);
  const playerHeight = maintainAspectRatio 
    ? getAspectRatioHeight(screenWidth - 32)
    : height || 220;

  const onStateChange = useCallback((state: string) => {
    console.log('Player state:', state);
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const onReady = useCallback(() => {
    console.log('Player ready');
    onLoadEnd?.();
  }, [onLoadEnd]);

  const onErrorCallback = useCallback((error: string) => {
    console.error('Player error:', error);
    setError(true);
    onError?.();
  }, [onError]);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const openInYouTube = () => {
    if (videoId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
    }
  };

  if (!videoId) {
    return (
      <View style={[styles.container, { height: playerHeight }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid YouTube URL</Text>
          <Text style={styles.errorSubtext}>Please check the video URL format</Text>
          <Text style={styles.debugText}>URL: {video_url}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { height: playerHeight }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load video</Text>
          <Text style={styles.errorSubtext}>This might be due to:</Text>
          <Text style={styles.debugText}>• Video is private or restricted</Text>
          <Text style={styles.debugText}>• Embedding disabled by uploader</Text>
          <Text style={styles.debugText}>• Network connectivity issues</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={() => setError(false)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.youtubeButton} onPress={openInYouTube}>
              <Text style={styles.youtubeButtonText}>Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: playerHeight }]}>
      <YoutubePlayer
        height={playerHeight}
        play={playing}
        videoId={videoId}
        onChangeState={onStateChange}
        onReady={onReady}
        onError={onErrorCallback}
        volume={50}
        playbackRate={1}
        playerParams={{
          cc_lang_pref: 'us',
          showClosedCaptions: true,
          controls: showControls,
          modestbranding: true,
          rel: false,
          showinfo: false,
          iv_load_policy: 3,
        }}
        initialPlayerParams={{
          controls: showControls,
          modestbranding: true,
          preventFullScreen: false,
          rel: false,
          showinfo: false,
          iv_load_policy: 3,
        }}
        forceAndroidAutoplay={autoplay}
        webViewStyle={styles.webview}
        webViewProps={{
          injectedJavaScript: `
            const meta = document.createElement('meta'); 
            meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); 
            meta.setAttribute('name', 'viewport'); 
            document.getElementsByTagName('head')[0].appendChild(meta);
          `,
          renderToHardwareTextureAndroid: true,
          allowsFullscreenVideo: true,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
        }}
      />
      
      {/* Optional: Custom controls overlay */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlaying}>
            <Text style={styles.playButtonText}>
              {playing ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  webview: {
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  debugText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  youtubeButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  youtubeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1,
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 20,
  },
});

export default YouTubePlayerComponent ;