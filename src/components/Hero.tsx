import { Image, MotiView, View } from 'moti';
import React, { memo, useState, useCallback } from 'react';
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, SearchStackParamList } from '../App';
import useContentStore from '../lib/zustand/contentStore';
import useHeroStore from '../lib/zustand/herostore';
import { Skeleton } from 'moti/skeleton';
import { settingsStorage } from '../lib/storage';
import { Feather } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DrawerLayout } from 'react-native-gesture-handler';
import { useHeroMetadata } from '../lib/hooks/useHomePageData';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// TV-specific constants
const isTV = Platform.isTV;
const TV_FOCUS_SCALE = 1.05;

interface HeroProps {
  isDrawerOpen: boolean;
  drawerRef: React.RefObject<DrawerLayout>;
  hasTVPreferredFocus?: boolean;
}

// TV-optimized focusable button component
const TVFocusableButton = ({
  onPress,
  hasTVPreferredFocus = false,
  style,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  style?: any;
  children: React.ReactNode;
  accessibilityLabel?: string;
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
        accessibilityLabel={accessibilityLabel}>
        <Animated.View style={[animatedStyle]}>
          <View style={[style, { position: 'relative' }]}>
            {children}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  borderWidth: 3,
                  borderColor: '#ffffff',
                  borderRadius: 10,
                },
                borderAnimatedStyle,
              ]}
              pointerEvents="none"
            />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={style}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </TouchableOpacity>
  );
};

const Hero = memo(
  ({ isDrawerOpen, drawerRef, hasTVPreferredFocus = false }: HeroProps) => {
    const [searchActive, setSearchActive] = useState(false);
    const { provider } = useContentStore(state => state);
    const { hero } = useHeroStore(state => state);

    // Memoize settings to prevent re-renders
    const [showHamburgerMenu] = useState(() =>
      settingsStorage.showHamburgerMenu(),
    );
    const [isDrawerDisabled] = useState(
      () => settingsStorage.getBool('disableDrawer') || false,
    );

    const navigation =
      useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const searchNavigation =
      useNavigation<NativeStackNavigationProp<SearchStackParamList>>();

    // Use React Query for hero metadata
    const {
      data: heroData,
      isLoading,
      error,
    } = useHeroMetadata(hero?.link || '', provider.value);

    // Memoized keyboard handler
    const handleKeyboardHide = useCallback(() => {
      setSearchActive(false);
    }, []);

    // Set up keyboard listener once
    React.useEffect(() => {
      const subscription = Keyboard.addListener(
        'keyboardDidHide',
        handleKeyboardHide,
      );
      return () => subscription?.remove();
    }, [handleKeyboardHide]);

    // Memoized handlers
    const handleSearchSubmit = useCallback(
      (text: string) => {
        if (text.startsWith('https://')) {
          navigation.navigate('Info', { link: text });
        } else {
          searchNavigation.navigate('ScrollList', {
            providerValue: provider.value,
            filter: text,
            title: provider.display_name,
            isSearch: true,
          });
        }
      },
      [navigation, searchNavigation, provider.value, provider.display_name],
    );

    const handlePlayPress = useCallback(() => {
      if (hero?.link) {
        navigation.navigate('Info', {
          link: hero.link,
          provider: provider.value,
          poster: heroData?.image || heroData?.poster || heroData?.background,
        });
      }
    }, [navigation, hero?.link, provider.value, heroData]);

    const handleImageError = useCallback(() => {
      // Handle image error silently - React Query will manage retries
      console.warn('Hero image failed to load');
    }, []);

    // Memoized image source
    const imageSource = React.useMemo(() => {
      const fallbackImage =
        'https://placehold.jp/24/363636/ffffff/500x500.png?text=Doodle';
      if (!heroData) {
        return { uri: fallbackImage };
      }

      return {
        uri:
          heroData.background ||
          heroData.image ||
          heroData.poster ||
          fallbackImage,
      };
    }, [heroData]);

    // Memoized genres
    const displayGenres = React.useMemo(() => {
      if (!heroData) {
        return [];
      }
      return (heroData.genre || heroData.tags || []).slice(0, 3);
    }, [heroData]);

    if (error) {
      console.error('Hero metadata error:', error);
    }

    return (
      <View className="relative h-[55vh]">
        {/* Header Controls */}
        <View className="absolute pt-3 w-full top-6 px-3 mt-2 z-30 flex-row justify-between items-center">
          {!searchActive && (
            <View
              className={`${showHamburgerMenu && !isDrawerDisabled
                  ? 'opacity-100'
                  : 'opacity-0'
                }`}>
              <Pressable
                className={`${isDrawerOpen ? 'opacity-0' : 'opacity-100'}`}
                onPress={() => drawerRef.current?.openDrawer()}>
                <Ionicons name="menu-sharp" size={27} color="white" />
              </Pressable>
            </View>
          )}

          {searchActive && (
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              //@ts-ignore
              transition={{ type: 'timing', duration: 300 }}
              className="w-full items-center justify-center">
              <TextInput
                onBlur={() => setSearchActive(false)}
                autoFocus={true}
                onSubmitEditing={e => handleSearchSubmit(e.nativeEvent.text)}
                placeholder={`Search in ${provider.display_name}`}
                className="w-[95%] px-4 h-10 rounded-full border-white border"
                placeholderTextColor="#999"
              />
            </MotiView>
          )}

          {!searchActive && (
            <Pressable onPress={() => setSearchActive(true)}>
              <Feather name="search" size={24} color="white" />
            </Pressable>
          )}
        </View>

        {/* Hero Image */}
        <Skeleton show={isLoading} colorMode="dark">
          <Image
            source={imageSource}
            onError={handleImageError}
            className="h-full w-full"
            style={{ resizeMode: 'cover' }}
          />
        </Skeleton>

        {/* Hero Content */}
        <View className="absolute bottom-12 w-full z-20 px-6">
          {!isLoading && heroData && (
            <View className="gap-4 items-center">
              {/* Title/Logo */}
              {heroData.logo ? (
                <Image
                  source={{ uri: heroData.logo }}
                  style={{
                    width: isTV ? 280 : 200,
                    height: isTV ? 120 : 100,
                    resizeMode: 'contain',
                  }}
                  onError={() => console.warn('Logo failed to load')}
                />
              ) : (
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    fontSize: isTV ? 36 : 24,
                    fontWeight: 'bold',
                  }}>
                  {heroData.name || heroData.title}
                </Text>
              )}

              {/* Genres */}
              {displayGenres.length > 0 && (
                <View className="flex-row items-center justify-center space-x-2">
                  {displayGenres.map((genre: string, index: number) => (
                    <Text
                      key={index}
                      style={{
                        color: 'white',
                        fontSize: isTV ? 18 : 14,
                        fontWeight: '600',
                      }}>
                      • {genre}
                    </Text>
                  ))}
                </View>
              )}

              {/* Play Button - TV optimized */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: isTV ? 16 : 8,
                }}>
                {hero?.link && (
                  <TVFocusableButton
                    onPress={handlePlayPress}
                    hasTVPreferredFocus={hasTVPreferredFocus}
                    style={{
                      backgroundColor: 'white',
                      paddingHorizontal: isTV ? 40 : 40,
                      paddingVertical: isTV ? 14 : 8,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    accessibilityLabel="Play">
                    <FontAwesome6
                      name="play"
                      size={isTV ? 24 : 20}
                      color="black"
                    />
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: isTV ? 20 : 18,
                      }}>
                      Play
                    </Text>
                  </TVFocusableButton>
                )}
              </View>
            </View>
          )}

          {/* Loading state */}
          {isLoading && (
            <View className="items-center">
              <Skeleton show={true} height={45} width={140} colorMode="dark" />
            </View>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <View className="items-center">
              <Text className="text-white text-center text-xl font-bold">
                {hero?.title || 'Content Unavailable'}
              </Text>
              <Text className="text-gray-400 text-sm mt-2">
                Unable to load details
              </Text>
            </View>
          )}
        </View>

        {/* Gradients */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', 'black']}
          locations={[0, 0.7, 1]}
          className="absolute h-full w-full"
        />

        {searchActive && (
          <LinearGradient
            colors={['black', 'transparent']}
            locations={[0, 0.3]}
            className="absolute h-[30%] w-full"
          />
        )}
      </View>
    );
  },
);

Hero.displayName = 'Hero';

export default Hero;
