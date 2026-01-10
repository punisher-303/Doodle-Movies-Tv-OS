import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TVFocusableButton } from './TVFocusable';
import {
  isTV,
  TV_FONT_SIZES,
  TV_SPACING,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from '../../lib/tv/constants';

interface TVHeroProps {
  title?: string;
  description?: string;
  genres?: string[];
  rating?: string;
  year?: string;
  backgroundImage?: string;
  logo?: string;
  posterImage?: string;
  onPlayPress?: () => void;
  onInfoPress?: () => void;
  onWatchlistPress?: () => void;
  isLoading?: boolean;
  hasTVPreferredFocus?: boolean;
}

/**
 * TVHero - A hero banner component optimized for TV displays
 * Similar to Netflix/Prime Video hero sections
 */
const TVHero: React.FC<TVHeroProps> = ({
  title = '',
  description = '',
  genres = [],
  rating = '',
  year = '',
  backgroundImage,
  logo,
  posterImage,
  onPlayPress,
  onWatchlistPress,
  isLoading = false,
  hasTVPreferredFocus = false,
}) => {
  const handlePlayPress = useCallback(() => {
    onPlayPress?.();
  }, [onPlayPress]);

  const handleWatchlistPress = useCallback(() => {
    onWatchlistPress?.();
  }, [onWatchlistPress]);

  const fallbackImage =
    'https://placehold.jp/24/363636/ffffff/1920x1080.png?text=Doodle';

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSkeleton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={{ uri: backgroundImage || posterImage || fallbackImage }}
        style={styles.backgroundImage}
        resizeMode="cover">
        {/* Gradient Overlays */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
          locations={[0, 0.5, 1]}
          style={styles.bottomGradient}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          locations={[0, 0.4]}
          style={styles.topGradient}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftGradient}
        />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            {logo ? (
              <Image
                source={{ uri: logo }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            )}

            {/* Metadata Row */}
            <View style={styles.metadataRow}>
              {year && <Text style={styles.metadataText}>{year}</Text>}
              {rating && (
                <>
                  <View style={styles.metadataDot} />
                  <Text style={styles.metadataText}>{rating}</Text>
                </>
              )}
              {genres.length > 0 && (
                <>
                  <View style={styles.metadataDot} />
                  <Text style={styles.metadataText}>
                    {genres.slice(0, 3).join(' • ')}
                  </Text>
                </>
              )}
            </View>

            {/* Description */}
            {description && (
              <Text style={styles.description} numberOfLines={3}>
                {description}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TVFocusableButton
              variant="primary"
              onPress={handlePlayPress}
              hasTVPreferredFocus={hasTVPreferredFocus}
              focusBorderColor="#ffffff"
              style={styles.playButton}
              accessibilityLabel="Play">
              <View style={styles.buttonContent}>
                <FontAwesome name="play" size={20} color="#ffffff" />
                <Text style={styles.playButtonText}>Play</Text>
              </View>
            </TVFocusableButton>

            {onWatchlistPress && (
              <TVFocusableButton
                variant="outline"
                onPress={handleWatchlistPress}
                focusBorderColor="#ffffff"
                style={styles.watchlistButton}
                accessibilityLabel="Add to Watchlist">
                <View style={styles.buttonContent}>
                  <MaterialIcons name="add" size={24} color="#ffffff" />
                  <Text style={styles.buttonText}>My List</Text>
                </View>
              </TVFocusableButton>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: isTV ? SCREEN_HEIGHT * 0.55 : SCREEN_HEIGHT * 0.5,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '30%',
  },
  leftGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
  },
  contentContainer: {
    position: 'absolute',
    left: TV_SPACING.xl,
    bottom: TV_SPACING.xl,
    width: isTV ? '45%' : '70%',
    maxWidth: 600,
  },
  titleSection: {
    marginBottom: TV_SPACING.lg,
  },
  logo: {
    width: 280,
    height: 120,
    marginBottom: TV_SPACING.md,
  },
  title: {
    fontSize: isTV ? 48 : 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: TV_SPACING.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: TV_SPACING.sm,
    flexWrap: 'wrap',
  },
  metadataText: {
    fontSize: TV_FONT_SIZES.body,
    color: '#cccccc',
  },
  metadataDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cccccc',
    marginHorizontal: TV_SPACING.xs,
  },
  description: {
    fontSize: TV_FONT_SIZES.body,
    color: '#aaaaaa',
    lineHeight: TV_FONT_SIZES.body * 1.4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV_SPACING.md,
  },
  playButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: isTV ? 32 : 24,
    paddingVertical: isTV ? 14 : 12,
    borderRadius: 4,
  },
  infoButton: {
    backgroundColor: 'rgba(109, 109, 110, 0.7)',
    paddingHorizontal: isTV ? 28 : 20,
    paddingVertical: isTV ? 14 : 12,
    borderRadius: 4,
  },
  watchlistButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: isTV ? 28 : 20,
    paddingVertical: isTV ? 12 : 10,
    borderRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TV_SPACING.sm,
  },
  playButtonText: {
    fontSize: TV_FONT_SIZES.subtitle,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonText: {
    fontSize: TV_FONT_SIZES.body,
    fontWeight: '500',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingSkeleton: {
    flex: 1,
    backgroundColor: '#333333',
  },
});

export default TVHero;
