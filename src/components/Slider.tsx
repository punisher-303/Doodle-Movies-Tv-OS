import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import React, { useCallback, useRef } from 'react';
import type { Post } from '../lib/providers/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '../App';
import useContentStore from '../lib/zustand/contentStore';
import { FlashList } from '@shopify/flash-list';
import SkeletonLoader from './Skeleton';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import useThemeStore from '../lib/zustand/themeStore';

// TV-specific constants
const isTV = Platform.isTV;
const TV_POSTER_WIDTH = isTV ? 160 : 100;
const TV_POSTER_HEIGHT = isTV ? 240 : 150;
const TV_FOCUS_SCALE = 1.0;

// TV-optimized focusable card component
const TVFocusableCard = ({
  item,
  onPress,
  primary,
  hasTVPreferredFocus = false,
}: {
  item: Post;
  onPress: () => void;
  provider: any;
  providerValue?: string;
  primary: string;
  index: number;
  hasTVPreferredFocus?: boolean;
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
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        isTVSelectable={true}
        style={{ marginHorizontal: 8 }}>
        <Animated.View style={animatedStyle}>
          <View style={{ position: 'relative' }}>
            <Image
              source={{
                uri:
                  item?.image ||
                  'https://placehold.jp/24/363636/ffffff/100x150.png?text=Doodle',
              }}
              style={{
                width: TV_POSTER_WIDTH,
                height: TV_POSTER_HEIGHT,
                borderRadius: 8,
              }}
            />
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
            {item.title.length > 24
              ? `${item.title.slice(0, 24)}...`
              : item.title}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  // Non-TV rendering
  return (
    <View className="flex flex-col mx-2">
      <TouchableOpacity onPress={onPress}>
        <Image
          className="rounded-md"
          source={{
            uri:
              item?.image ||
              'https://placehold.jp/24/363636/ffffff/100x150.png?text=Doodle',
          }}
          style={{ width: TV_POSTER_WIDTH, height: TV_POSTER_HEIGHT }}
        />
      </TouchableOpacity>
      <Text className="text-white text-center truncate w-24 text-xs">
        {item.title.length > 24 ? `${item.title.slice(0, 24)}...` : item.title}
      </Text>
    </View>
  );
};

export default function Slider({
  isLoading,
  title,
  posts,
  filter,
  providerValue,
  isSearch = false,
  hasTVPreferredFocus = false,
}: {
  isLoading: boolean;
  title: string;
  posts: Post[];
  filter: string;
  providerValue?: string;
  isSearch?: boolean;
  hasTVPreferredFocus?: boolean;
}): JSX.Element {
  const { provider } = useContentStore(state => state);
  const { primary } = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [isSelected, setSelected] = React.useState('');
  const flashListRef = useRef<FlashList<Post>>(null);

  const handleItemPress = useCallback(
    (item: Post) => {
      setSelected('');
      navigation.navigate('Info', {
        link: item.link,
        provider: item.provider || providerValue || provider?.value,
        poster: item?.image,
      });
    },
    [navigation, providerValue, provider?.value],
  );

  const handleSeeMorePress = useCallback(() => {
    navigation.navigate('ScrollList', {
      title: title,
      filter: filter,
      providerValue: providerValue,
      isSearch: isSearch,
    });
  }, [navigation, title, filter, providerValue, isSearch]);

  return (
    <Pressable
      onPress={() => setSelected('')}
      style={{ gap: 12, marginTop: 12, paddingHorizontal: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{ color: primary, fontSize: isTV ? 28 : 24, fontWeight: '600' }}>
          {title}
        </Text>
        {filter !== 'recent' && (
          <Pressable
            onPress={handleSeeMorePress}
            focusable={isTV}
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: 'white', fontSize: isTV ? 16 : 14 }}>
              {isTV ? 'See All' : 'more'}
            </Text>
          </Pressable>
        )}
      </View>
      {isLoading ? (
        <View style={{ flexDirection: 'row', gap: 8, overflow: 'hidden' }}>
          {Array.from({ length: isTV ? 8 : 20 }).map((_, index) => (
            <View
              style={{
                marginHorizontal: 12,
                gap: 0,
                marginBottom: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              key={index}>
              <SkeletonLoader
                height={TV_POSTER_HEIGHT}
                width={TV_POSTER_WIDTH}
              />
              <SkeletonLoader height={12} width={TV_POSTER_WIDTH - 3} />
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          ref={flashListRef}
          estimatedItemSize={TV_POSTER_WIDTH + 16}
          showsHorizontalScrollIndicator={false}
          data={posts}
          extraData={isSelected}
          horizontal
          contentContainerStyle={{ paddingHorizontal: 3, paddingTop: 7 }}
          renderItem={({ item, index }) => (
            <TVFocusableCard
              item={item}
              onPress={() => handleItemPress(item)}
              provider={provider}
              providerValue={providerValue}
              primary={primary}
              index={index}
              hasTVPreferredFocus={hasTVPreferredFocus && index === 0}
            />
          )}
          ListFooterComponent={
            !isLoading && posts.length === 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  width: 384,
                  justifyContent: 'center',
                  height: 40,
                  alignItems: 'center',
                }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  No content found
                </Text>
              </View>
            ) : null
          }
          keyExtractor={item => item.link}
        />
      )}
    </Pressable>
  );
}
