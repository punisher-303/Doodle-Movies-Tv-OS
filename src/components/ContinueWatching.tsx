import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import { mainStorage as MMKV } from '../lib/storage/StorageService';
import { useNavigation } from '@react-navigation/native';
import useThemeStore from '../lib/zustand/themeStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabStackParamList } from '../App';
import AntDesign from '@expo/vector-icons/AntDesign';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// TV-specific constants
const isTV = Platform.isTV;
const TV_POSTER_WIDTH = isTV ? 160 : 100;
const TV_POSTER_HEIGHT = isTV ? 240 : 150;
const TV_FOCUS_SCALE = 1;

const ContinueWatching = () => {
  const { primary } = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<TabStackParamList>>();
  const { history, removeItem } = useWatchHistoryStore(state => state);
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  // Filter out duplicates and get the most recent items
  const recentItems = React.useMemo(() => {
    const seen = new Set();
    const items = history
      .filter(item => {
        if (seen.has(item.link)) {
          return false;
        }
        seen.add(item.link);
        return true;
      })
      .slice(0, 10); // Limit to 10 items

    return items;
  }, [history]);

  // Load progress data
  useEffect(() => {
    const loadProgressData = () => {
      const progressMap: Record<string, number> = {};

      recentItems.forEach(item => {
        try {
          // Try to get dedicated watch history progress
          const historyKey = item.link;
          const historyProgressKey = `watch_history_progress_${historyKey}`;
          const storedProgress = MMKV.getString(historyProgressKey);

          if (storedProgress) {
            const parsed = JSON.parse(storedProgress);
            if (parsed.percentage) {
              progressMap[item.link] = Math.min(
                Math.max(parsed.percentage, 0),
                100,
              );
            } else if (parsed.currentTime && parsed.duration) {
              const percentage = (parsed.currentTime / parsed.duration) * 100;
              progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
            }
          } else if (item.currentTime && item.duration) {
            const percentage = (item.currentTime / item.duration) * 100;
            progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
          }
        } catch (e) {
          console.error('Error processing progress for item:', item.title, e);
        }
      });

      setProgressData(progressMap);
    };

    loadProgressData();
  }, [recentItems]);

  const handleNavigateToInfo = (item: any) => {
    try {
      // Parse the link if it's a JSON string
      let linkData = item.link;
      if (typeof item.link === 'string' && item.link.startsWith('{')) {
        try {
          linkData = JSON.parse(item.link);
        } catch (e) {
          console.error('Failed to parse link:', e);
        }
      }
      console.log('linkData', item.poster);
      // Navigate to Info screen
      navigation.navigate('HomeStack', {
        screen: 'Info',
        params: {
          link: linkData,
          provider: item.provider,
          poster: item.poster,
        },
      } as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const toggleItemSelection = (link: string) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(link)) {
        newSelected.delete(link);
      } else {
        newSelected.add(link);
      }

      // Exit selection mode if no items are selected
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }

      return newSelected;
    });
  };

  const handleLongPress = (link: string) => {
    ReactNativeHapticFeedback.trigger('effectClick', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    // Enter selection mode if not already in it
    if (!selectionMode) {
      setSelectionMode(true);
    }

    toggleItemSelection(link);
  };

  const handlePress = (item: any) => {
    if (selectionMode) {
      toggleItemSelection(item.link);
    } else {
      handleNavigateToInfo(item);
    }
  };

  const deleteSelectedItems = () => {
    recentItems.forEach(item => {
      if (selectedItems.has(item.link)) {
        removeItem(item);
      }
    });
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  // Only render if we have items (MOVED AFTER ALL HOOKS)
  if (recentItems.length === 0) {
    return null;
  }

  // TV-optimized focusable card component
  const TVFocusableWatchCard = ({
    item,
    progress,
    isSelected,
    index,
  }: {
    item: any;
    progress: number;
    isSelected: boolean;
    index: number;
  }) => {
    const scale = useSharedValue(1);
    const borderOpacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const borderAnimatedStyle = useAnimatedStyle(() => ({
      opacity: borderOpacity.value,
    }));

    const handleFocus = useCallback(() => {
      scale.value = withTiming(TV_FOCUS_SCALE, { duration: 150 });
      borderOpacity.value = withTiming(1, { duration: 150 });
    }, []);

    const handleBlur = useCallback(() => {
      scale.value = withTiming(1, { duration: 150 });
      borderOpacity.value = withTiming(0, { duration: 150 });
    }, []);

    if (isTV) {
      return (
        <Pressable
          onPress={() => handlePress(item)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          hasTVPreferredFocus={index === 0}
          isTVSelectable={true}
          style={{
            marginHorizontal: 8,
            marginVertical: 13,
            maxWidth: TV_POSTER_WIDTH,
          }}>
          <Animated.View style={animatedStyle}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{
                  uri:
                    item?.poster ||
                    'https://placehold.jp/24/363636/ffffff/100x150.png?text=Doodle',
                }}
                style={{
                  width: TV_POSTER_WIDTH,
                  height: TV_POSTER_HEIGHT,
                  borderRadius: 8,
                }}
              />

              {/* Focus Border */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: -3,
                    left: -3,
                    right: -3,
                    bottom: -3,
                    borderWidth: 3,
                    borderColor: primary,
                    borderRadius: 10,
                  },
                  borderAnimatedStyle,
                ]}
                pointerEvents="none"
              />

              {/* Progress Bar */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}>
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: primary,
                  }}
                />
              </View>
            </View>
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontSize: isTV ? 14 : 12,
                width: TV_POSTER_WIDTH,
                marginTop: 4,
              }}
              numberOfLines={2}>
              {item.title}
            </Text>
          </Animated.View>
        </Pressable>
      );
    }

    // Non-TV version
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={{ maxWidth: TV_POSTER_WIDTH, marginHorizontal: 8 }}
        onLongPress={e => {
          e.stopPropagation();
          handleLongPress(item.link);
        }}
        onPress={e => {
          e.stopPropagation();
          handlePress(item);
        }}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item?.poster }}
            style={{
              width: TV_POSTER_WIDTH,
              height: TV_POSTER_HEIGHT,
              borderRadius: 8,
            }}
          />

          {selectionMode && (
            <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 50 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'white',
                  backgroundColor: isSelected
                    ? primary
                    : 'rgba(255,255,255,0.3)',
                }}>
                {isSelected && (
                  <AntDesign name="check" size={12} color="white" />
                )}
              </View>
            </View>
          )}

          {isSelected && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
              }}
            />
          )}

          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progress}%`,
                backgroundColor: primary,
              }}
            />
          </View>
        </View>
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
            fontSize: 12,
            width: TV_POSTER_WIDTH,
          }}
          numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Pressable
      onPress={() => selectionMode && exitSelectionMode()}
      style={{ marginTop: 12, marginBottom: isTV ? 16 : 32 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 8,
          marginBottom: 12,
        }}>
        <Text
          style={{ fontSize: isTV ? 28 : 24, fontWeight: '600', color: primary }}>
          Continue Watching
        </Text>

        {selectionMode && selectedItems.size > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', marginRight: 4 }}>
              {selectedItems.size} selected
            </Text>
            <TouchableOpacity
              onPress={deleteSelectedItems}
              style={{ borderRadius: 20, marginRight: 8 }}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={25}
                color={primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={recentItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.link}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item, index }) => {
          const progress = progressData[item.link] || 0;
          const isSelected = selectedItems.has(item.link);

          return (
            <TVFocusableWatchCard
              item={item}
              progress={progress}
              isSelected={isSelected}
              index={index}
            />
          );
        }}
      />
    </Pressable>
  );
};

export default ContinueWatching;
