import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  View,
  Text,
} from 'react-native';
import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import useContentStore from '../../lib/zustand/contentStore';
import useHeroStore from '../../lib/zustand/herostore';
import {
  useHomePageData,
  getRandomHeroPost,
  useHeroMetadata,
} from '../../lib/hooks/useHomePageData';
import useThemeStore from '../../lib/zustand/themeStore';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../App';
import {providerManager} from '../../lib/services/ProviderManager';
import Tutorial from '../../components/Touturial';
import {QueryErrorBoundary} from '../../components/ErrorBoundary';
import {StatusBar} from 'expo-status-bar';
import {mainStorage as MMKV} from '../../lib/storage/StorageService';

// TV Components
import TVHero from '../../components/tv/TVHero';
import TVSlider from '../../components/tv/TVSlider';
import TVContinueWatching from '../../components/tv/TVContinueWatching';
import {isTV, TV_SPACING} from '../../lib/tv/constants';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

/**
 * TVHome - TV-optimized home screen with D-pad/remote navigation support
 */
const TVHome = ({navigation}: Props) => {
  const {primary} = useThemeStore(state => state);
  const scrollViewRef = useRef<ScrollView>(null);

  const {provider, installedProviders} = useContentStore(state => state);
  const {hero, setHero} = useHeroStore(state => state);
  const {history} = useWatchHistoryStore(state => state);

  // Load progress data for continue watching
  const [progressData, setProgressData] = useState<Record<string, number>>({});

  // Filter continue watching items
  const continueWatchingItems = useMemo(() => {
    const seen = new Set();
    return history
      .filter(item => {
        if (seen.has(item.link)) {
          return false;
        }
        seen.add(item.link);
        return true;
      })
      .slice(0, 10);
  }, [history]);

  // Load progress data
  useEffect(() => {
    const loadProgressData = () => {
      const progressMap: Record<string, number> = {};

      continueWatchingItems.forEach(item => {
        try {
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
          console.error('Error processing progress:', e);
        }
      });

      setProgressData(progressMap);
    };

    loadProgressData();
  }, [continueWatchingItems]);

  // React Query for home page data
  const {
    data: homeData = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useHomePageData({
    provider,
    enabled: !!(installedProviders?.length && provider?.value),
  });

  // Hero post calculation
  const heroPost = useMemo(() => {
    if (!homeData || homeData.length === 0) {
      return null;
    }
    return getRandomHeroPost(homeData);
  }, [homeData]);

  // Use React Query for hero metadata
  const {data: heroData, isLoading: isHeroLoading} = useHeroMetadata(
    hero?.link || '',
    provider.value,
  );

  // Update hero when hero post changes
  useEffect(() => {
    if (heroPost) {
      setHero(heroPost);
    } else {
      setHero({link: '', image: '', title: ''});
    }
  }, [heroPost, setHero]);

  // Navigation handlers
  const handleHeroPlayPress = useCallback(() => {
    if (hero?.link) {
      navigation.navigate('Info', {
        link: hero.link,
        provider: provider.value,
        poster: heroData?.image || heroData?.poster || heroData?.background,
      });
    }
  }, [navigation, hero?.link, provider.value, heroData]);

  const handleHeroInfoPress = useCallback(() => {
    if (hero?.link) {
      navigation.navigate('Info', {
        link: hero.link,
        provider: provider.value,
        poster: heroData?.image || heroData?.poster || heroData?.background,
      });
    }
  }, [navigation, hero?.link, provider.value, heroData]);

  const handleSliderItemPress = useCallback(
    (item: any) => {
      navigation.navigate('Info', {
        link: item.link,
        provider: item.provider || provider?.value,
        poster: item?.image,
      });
    },
    [navigation, provider?.value],
  );

  const handleContinueWatchingPress = useCallback(
    (item: any) => {
      navigation.navigate('Info', {
        link: item.link,
        provider: item.provider,
        poster: item.poster,
      });
    },
    [navigation],
  );

  const handleSeeMorePress = useCallback(
    (filter: string, title: string) => {
      navigation.navigate('ScrollList', {
        title,
        filter,
        providerValue: provider?.value,
        isSearch: false,
      });
    },
    [navigation, provider?.value],
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (refreshError) {
      console.error('Error refreshing home data:', refreshError);
    }
  }, [refetch]);

  // Loading sliders
  const loadingSliders = useMemo(() => {
    if (!provider?.value) {
      return [];
    }

    return providerManager
      .getCatalog({providerValue: provider.value})
      .map((item, index) => (
        <TVSlider
          key={`loading-${item.filter}-${index}`}
          title={item.title}
          data={[]}
          onItemPress={() => {}}
          isLoading={true}
          focusBorderColor={primary}
        />
      ));
  }, [provider?.value, primary]);

  // Content sliders
  const contentSliders = useMemo(() => {
    return homeData.map((item, index) => (
      <TVSlider
        key={`content-${item.filter}-${index}`}
        title={item.title}
        data={item.Posts.map(post => ({
          id: post.link,
          title: post.title,
          image: post.image,
          link: post.link,
          provider: post.provider,
        }))}
        onItemPress={handleSliderItemPress}
        onSeeMorePress={
          item.filter !== 'recent'
            ? () => handleSeeMorePress(item.filter, item.title)
            : undefined
        }
        isLoading={false}
        focusBorderColor={primary}
        hasTVPreferredFocus={index === 0 && !continueWatchingItems.length}
      />
    ));
  }, [
    homeData,
    handleSliderItemPress,
    handleSeeMorePress,
    primary,
    continueWatchingItems.length,
  ]);

  // Error component
  const errorComponent = useMemo(() => {
    if (!error && (isLoading || homeData.length > 0)) {
      return null;
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error?.message || 'Failed to load content'}
        </Text>
        <Text style={styles.errorSubtext}>Press Select to refresh</Text>
      </View>
    );
  }, [error, isLoading, homeData.length]);

  // Early return for no providers
  if (
    !installedProviders ||
    installedProviders.length === 0 ||
    !provider?.value
  ) {
    return <Tutorial />;
  }

  return (
    <QueryErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" animated={true} translucent={true} />

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              colors={[primary]}
              tintColor={primary}
              progressBackgroundColor="black"
              refreshing={isRefetching}
              onRefresh={handleRefresh}
            />
          }>
          {/* TV Hero Section */}
          <TVHero
            title={heroData?.name || heroData?.title || hero?.title}
            // subtitle={heroData?.synopsis}
            description={heroData?.synopsis}
            genres={heroData?.genre || heroData?.tags || []}
            rating={heroData?.imdbRating}
            year={heroData?.year}
            backgroundImage={
              heroData?.background || heroData?.image || hero?.image
            }
            logo={heroData?.logo}
            posterImage={heroData?.poster || heroData?.image}
            onPlayPress={handleHeroPlayPress}
            onInfoPress={handleHeroInfoPress}
            isLoading={isHeroLoading && !heroData}
            hasTVPreferredFocus={true}
            // focusBorderColor={primary}
          />

          {/* Continue Watching Section */}
          {continueWatchingItems.length > 0 && (
            <TVContinueWatching
              items={continueWatchingItems}
              progressData={progressData}
              onItemPress={handleContinueWatchingPress}
              hasTVPreferredFocus={false}
            />
          )}

          {/* Content Sliders */}
          <View style={styles.slidersContainer}>
            {isLoading ? loadingSliders : contentSliders}
            {errorComponent}
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </QueryErrorBoundary>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000000',
  } as const,
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  } as const,
  scrollContent: {
    flexGrow: 1,
  } as const,
  slidersContainer: {
    marginTop: -TV_SPACING.lg,
    zIndex: 20,
  } as const,
  bottomSpacer: {
    height: isTV ? 80 : 64,
  } as const,
  errorContainer: {
    padding: TV_SPACING.lg,
    margin: TV_SPACING.lg,
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderRadius: 8,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  errorText: {
    color: '#E50914',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: isTV ? 20 : 16,
  } as const,
  errorSubtext: {
    color: '#888888',
    textAlign: 'center',
    fontSize: isTV ? 16 : 14,
    marginTop: TV_SPACING.xs,
  } as const,
};

export default React.memo(TVHome);
