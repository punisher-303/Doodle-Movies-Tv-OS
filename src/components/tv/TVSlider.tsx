import React, {useRef, useCallback} from 'react';
import {View, Text, FlatList, StyleSheet, ViewStyle} from 'react-native';
import TVFocusable, {TVFocusableCard} from './TVFocusable';
import {
  TV_CARD_WIDTH,
  TV_CARD_HEIGHT,
  TV_CARD_MARGIN,
  TV_FONT_SIZES,
  TV_SPACING,
} from '../../lib/tv/constants';

interface TVSliderItem {
  id: string;
  title: string;
  image?: string;
  link: string;
  provider?: string;
}

interface TVSliderProps {
  title: string;
  data: TVSliderItem[];
  onItemPress: (item: TVSliderItem) => void;
  onSeeMorePress?: () => void;
  isLoading?: boolean;
  focusBorderColor?: string;
  style?: ViewStyle;
  hasTVPreferredFocus?: boolean;
}

/**
 * TVSlider - A horizontal scrolling list optimized for TV remote navigation
 */
const TVSlider: React.FC<TVSliderProps> = ({
  title,
  data,
  onItemPress,
  onSeeMorePress,
  isLoading = false,
  focusBorderColor = '#E50914',
  style,
  hasTVPreferredFocus = false,
}) => {
  const flatListRef = useRef<FlatList>(null);

  const handleItemFocus = useCallback(
    (index: number) => {
      // Auto-scroll to keep focused item visible
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.3, // Keep item slightly left of center
      });
    },
    [flatListRef],
  );

  const renderItem = useCallback(
    ({item, index}: {item: TVSliderItem; index: number}) => {
      return (
        <TVFocusableCard
          onPress={() => onItemPress(item)}
          onFocus={() => handleItemFocus(index)}
          width={TV_CARD_WIDTH}
          height={TV_CARD_HEIGHT}
          focusBorderColor={focusBorderColor}
          hasTVPreferredFocus={hasTVPreferredFocus && index === 0}
          style={styles.cardContainer}
          accessibilityLabel={item.title}>
          <View style={styles.imageContainer}>
            {item.image ? (
              <View
                style={[
                  styles.poster,
                  {
                    width: TV_CARD_WIDTH,
                    height: TV_CARD_HEIGHT - 40,
                  },
                ]}>
                <View
                  style={[
                    styles.posterImage,
                    {
                      width: TV_CARD_WIDTH,
                      height: TV_CARD_HEIGHT - 40,
                    },
                  ]}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.posterPlaceholder,
                  {
                    width: TV_CARD_WIDTH,
                    height: TV_CARD_HEIGHT - 40,
                  },
                ]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </TVFocusableCard>
      );
    },
    [onItemPress, handleItemFocus, focusBorderColor, hasTVPreferredFocus],
  );

  const keyExtractor = useCallback(
    (item: TVSliderItem) => item.id || item.link,
    [],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map(i => (
            <View
              key={i}
              style={[
                styles.loadingSkeleton,
                {width: TV_CARD_WIDTH, height: TV_CARD_HEIGHT},
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
        {onSeeMorePress && (
          <TVFocusable
            onPress={onSeeMorePress}
            style={styles.seeMoreButton}
            focusScale={1.05}
            showFocusBorder={false}>
            <Text style={styles.seeMoreText}>See All →</Text>
          </TVFocusable>
        )}
      </View>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{width: TV_CARD_MARGIN}} />}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={6}
        getItemLayout={(_, index) => ({
          length: TV_CARD_WIDTH + TV_CARD_MARGIN,
          offset: (TV_CARD_WIDTH + TV_CARD_MARGIN) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: TV_SPACING.md,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: TV_SPACING.lg,
    marginBottom: TV_SPACING.sm,
  },
  title: {
    fontSize: TV_FONT_SIZES.title,
    fontWeight: '600',
    color: '#ffffff',
  },
  seeMoreButton: {
    paddingHorizontal: TV_SPACING.md,
    paddingVertical: TV_SPACING.xs,
  },
  seeMoreText: {
    fontSize: TV_FONT_SIZES.body,
    color: '#cccccc',
  },
  listContent: {
    paddingHorizontal: TV_SPACING.lg,
  },
  cardContainer: {
    marginHorizontal: TV_CARD_MARGIN / 2,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    backgroundColor: '#333333',
  },
  posterImage: {
    backgroundColor: '#333333',
  },
  posterPlaceholder: {
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666666',
    fontSize: TV_FONT_SIZES.small,
  },
  titleContainer: {
    paddingVertical: TV_SPACING.xs,
    paddingHorizontal: TV_SPACING.xs,
  },
  itemTitle: {
    fontSize: TV_FONT_SIZES.small,
    color: '#ffffff',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    paddingHorizontal: TV_SPACING.lg,
  },
  loadingSkeleton: {
    backgroundColor: '#333333',
    borderRadius: 8,
    marginRight: TV_CARD_MARGIN,
  },
});

export default TVSlider;
