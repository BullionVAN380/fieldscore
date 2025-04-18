import React, { useState, useEffect } from 'react';
import { 
  Image, 
  ImageProps, 
  ImageStyle, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  style?: ImageStyle;
  placeholderColor?: string;
  cacheTimeout?: number; // Time in milliseconds before cached image expires
  lowQualityUri?: string; // Optional low quality placeholder image
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholderColor = '#e1e2e3',
  cacheTimeout = 7 * 24 * 60 * 60 * 1000, // 1 week by default
  lowQualityUri,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [cachedSource, setCachedSource] = useState<{ uri: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Skip caching for local assets or web platform
        if (typeof source === 'number' || Platform.OS === 'web') {
          setCachedSource(typeof source === 'number' ? source : { uri: source.uri });
          setLoading(false);
          return;
        }

        const { uri } = source;
        
        // Generate a unique filename based on the URI
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          uri
        );
        const ext = uri.split('.').pop() || 'jpg';
        const cacheFolder = `${FileSystem.cacheDirectory}images/`;
        const cacheFilePath = `${cacheFolder}${hash}.${ext}`;

        // Create cache directory if it doesn't exist
        const cacheDir = await FileSystem.getInfoAsync(cacheFolder);
        if (!cacheDir.exists) {
          await FileSystem.makeDirectoryAsync(cacheFolder, { intermediates: true });
        }

        // Check if the file exists in cache
        const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
        
        if (fileInfo.exists) {
          // Check if cache has expired
          const now = new Date().getTime();
          const fileTimestamp = fileInfo.modificationTime ? fileInfo.modificationTime * 1000 : 0;
          
          if (now - fileTimestamp > cacheTimeout) {
            // Cache expired, download again
            console.log('Cache expired, downloading again:', uri);
            const downloadResult = await FileSystem.downloadAsync(uri, cacheFilePath);
            setCachedSource({ uri: downloadResult.uri });
          } else {
            // Use cached file
            console.log('Using cached image:', cacheFilePath);
            setCachedSource({ uri: fileInfo.uri });
          }
        } else {
          // File doesn't exist in cache, download it
          console.log('Downloading and caching image:', uri);
          const downloadResult = await FileSystem.downloadAsync(uri, cacheFilePath);
          setCachedSource({ uri: downloadResult.uri });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading image:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading image'));
        setLoading(false);
        
        // If there's an error, use the original source as fallback
        if (typeof source !== 'number') {
          setCachedSource(source);
        }
      }
    };

    loadImage();
  }, [source, cacheTimeout]);

  if (loading) {
    return (
      <View 
        style={[
          styles.placeholder, 
          style, 
          { backgroundColor: placeholderColor }
        ]}
      >
        {lowQualityUri ? (
          <Image 
            source={{ uri: lowQualityUri }} 
            style={[styles.lowQualityImage, style]}
            blurRadius={2}
          />
        ) : (
          <ActivityIndicator size="small" color="#999" />
        )}
      </View>
    );
  }

  if (error || !cachedSource) {
    // Show a placeholder if there was an error
    return (
      <View 
        style={[
          styles.placeholder, 
          style, 
          { backgroundColor: '#ff000020' }
        ]}
      />
    );
  }

  return (
    <Image
      source={cachedSource}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowQualityImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }
});

export default React.memo(OptimizedImage);
