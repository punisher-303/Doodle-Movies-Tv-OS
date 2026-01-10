import {View, Text, FlatList, Platform, Pressable, findNodeHandle} from 'react-native';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import {MaterialIcons, Ionicons, Feather} from '@expo/vector-icons';
import {TextInput} from 'react-native';
import {TouchableOpacity} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';
import {MMKV} from '../lib/Mmkv';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  SlideInRight,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {searchOMDB} from '../lib/services/omdb';
import debounce from 'lodash/debounce';
import {OMDBResult} from '../types/omdb';

const isTV = Platform.isTV;

const MAX_VISIBLE_RESULTS = 15; // Limit number of animated items to prevent excessive callbacks
const MAX_HISTORY_ITEMS = 30; // Maximum number of history items to store

const Search = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [searchText, setSearchText] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(
    MMKV.getArray<string>('searchHistory') || [],
  );
  const [searchResults, setSearchResults] = useState<OMDBResult[]>([]);
  
  // Refs for TV focus navigation
  const firstItemRef = useRef<View>(null);
  const searchInputRef = useRef<View>(null);

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (text.length >= 2) {
        setSearchResults([]); // Clear previous results
        const results = await searchOMDB(text);
        if (results.length > 0) {
          // Remove duplicates based on imdbID
          const uniqueResults = results.reduce((acc, current) => {
            const x = acc.find(
              (item: OMDBResult) => item.imdbID === current.imdbID,
            );
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          }, [] as OMDBResult[]);

          // Limit the number of results to prevent excessive animations
          setSearchResults(uniqueResults.slice(0, MAX_VISIBLE_RESULTS));
        }
      } else {
        setSearchResults([]);
      }
    }, 300), // Reduced debounce time for better responsiveness
    [],
  );

  useEffect(() => {
    debouncedSearch(searchText);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchText, debouncedSearch]);

  const handleSearch = (text: string) => {
    if (text.trim()) {
      // Save to search history
      const prevSearches = MMKV.getArray<string>('searchHistory') || [];
      if (!prevSearches.includes(text.trim())) {
        const newSearches = [text.trim(), ...prevSearches].slice(
          0,
          MAX_HISTORY_ITEMS,
        );
        MMKV.setArray('searchHistory', newSearches);
        setSearchHistory(newSearches);
      }

      navigation.navigate('SearchResults', {
        filter: text.trim(),
      });
    }
  };

  const removeHistoryItem = (search: string) => {
    const newSearches = searchHistory.filter(item => item !== search);
    MMKV.setArray('searchHistory', newSearches);
    setSearchHistory(newSearches);
  };

  const clearHistory = () => {
    MMKV.setArray('searchHistory', []);
    setSearchHistory([]);
  };

  // TV Focusable Search Result Item
  const TVFocusableResultItem = ({
    item,
    index,
  }: {
    item: OMDBResult;
    index: number;
  }) => {
    const backgroundColor = useSharedValue('transparent');
    const borderLeftWidth = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: backgroundColor.value,
      borderLeftWidth: borderLeftWidth.value,
      borderLeftColor: primary,
    }));

    const handlePress = () => {
      const searchTitle = item.Title;
      const prevSearches = MMKV.getArray<string>('searchHistory') || [];
      if (searchTitle && !prevSearches.includes(searchTitle)) {
        const newSearches = [searchTitle, ...prevSearches].slice(
          0,
          MAX_HISTORY_ITEMS,
        );
        MMKV.setArray('searchHistory', newSearches);
        setSearchHistory(newSearches);
      }
      navigation.navigate('SearchResults', {
        filter: searchTitle,
      });
    };

    if (isTV) {
      return (
        <Pressable
          ref={index === 0 ? firstItemRef : undefined}
          onPress={handlePress}
          onFocus={() => {
            backgroundColor.value = withTiming('rgba(255,255,255,0.1)', {
              duration: 150,
            });
            borderLeftWidth.value = withTiming(4, {duration: 150});
          }}
          onBlur={() => {
            backgroundColor.value = withTiming('transparent', {duration: 150});
            borderLeftWidth.value = withTiming(0, {duration: 150});
          }}
          isTVSelectable={true}
          nextFocusUp={index === 0 ? findNodeHandle(searchInputRef.current) ?? undefined : undefined}>
          <Animated.View
            style={[
              animatedStyle,
              {
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.1)',
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}>
            <MaterialIcons
              name="search"
              size={20}
              color="#666"
              style={{marginRight: 12}}
            />
            <View>
              <Text style={{color: 'white', fontSize: 16}}>{item.Title}</Text>
              <Text style={{color: 'rgba(255,255,255,0.5)', fontSize: 12}}>
                {item.Type === 'series' ? 'TV Show' : 'Movie'} • {item.Year}
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <View className="px-4">
        <TouchableOpacity
          className="py-3 border-b border-white/10"
          onPress={handlePress}>
          <View className="flex-row items-center">
            <MaterialIcons
              name="search"
              size={20}
              color="#666"
              style={{marginRight: 12}}
            />
            <View>
              <Text className="text-white text-base">{item.Title}</Text>
              <Text className="text-white/50 text-xs">
                {item.Type === 'series' ? 'TV Show' : 'Movie'} • {item.Year}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // TV Focusable History Item
  const TVFocusableHistoryItem = ({
    search,
    index,
  }: {
    search: string;
    index: number;
  }) => {
    const backgroundColor = useSharedValue('transparent');
    const borderLeftWidth = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: backgroundColor.value,
      borderLeftWidth: borderLeftWidth.value,
      borderLeftColor: primary,
    }));

    if (isTV) {
      return (
        <Pressable
          ref={index === 0 ? firstItemRef : undefined}
          onPress={() => handleSearch(search)}
          onFocus={() => {
            backgroundColor.value = withTiming('rgba(255,255,255,0.15)', {
              duration: 150,
            });
            borderLeftWidth.value = withTiming(4, {duration: 150});
          }}
          onBlur={() => {
            backgroundColor.value = withTiming('transparent', {duration: 150});
            borderLeftWidth.value = withTiming(0, {duration: 150});
          }}
          isTVSelectable={true}
          nextFocusUp={index === 0 ? findNodeHandle(searchInputRef.current) ?? undefined : undefined}>
          <Animated.View
            style={[
              animatedStyle,
              {
                backgroundColor: '#141414',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
              },
            ]}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: 6,
                }}>
                <Ionicons name="time-outline" size={16} color={primary} />
              </View>
              <Text style={{color: 'white', fontSize: 14, marginLeft: 8}}>
                {search}
              </Text>
            </View>
            <Pressable
              onPress={() => removeHistoryItem(search)}
              isTVSelectable={true}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 20,
                padding: 6,
              }}>
              <Feather name="x" size={14} color="#999" />
            </Pressable>
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <View className="bg-[#141414] rounded-lg p-3 mb-2 flex-row justify-between items-center border border-white/5">
        <TouchableOpacity
          onPress={() => handleSearch(search)}
          className="flex-row flex-1 items-center space-x-2">
          <View className="bg-white/10 rounded-full p-1.5">
            <Ionicons name="time-outline" size={16} color={primary} />
          </View>
          <Text className="text-white text-sm ml-2">{search}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => removeHistoryItem(search)}
          className="bg-white/5 rounded-full p-1.5">
          <Feather name="x" size={14} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  // TV Focusable Clear History Button
  const TVFocusableClearButton = () => {
    const backgroundColor = useSharedValue('rgba(239,68,68,0.1)');

    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: backgroundColor.value,
    }));

    if (isTV) {
      return (
        <Pressable
          onPress={clearHistory}
          onFocus={() => {
            backgroundColor.value = withTiming('rgba(239,68,68,0.3)', {
              duration: 150,
            });
          }}
          onBlur={() => {
            backgroundColor.value = withTiming('rgba(239,68,68,0.1)', {
              duration: 150,
            });
          }}
          isTVSelectable={true}>
          <Animated.View
            style={[
              animatedStyle,
              {
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 2,
              },
            ]}>
            <Text style={{color: '#ef4444', fontSize: 12}}>Clear All</Text>
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <TouchableOpacity
        onPress={clearHistory}
        className="bg-red-500/10 rounded-full px-2 py-0.5">
        <Text className="text-red-500 text-xs">Clear All</Text>
      </TouchableOpacity>
    );
  };

  // Conditionally render animations based on state
  const AnimatedContainer = Animated.View;

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Title Section */}
      <AnimatedContainer
        entering={isTV ? undefined : FadeInDown.springify()}
        layout={isTV ? undefined : Layout.springify()}
        className="px-4 pt-4">
        <Text
          className="text-white font-bold mb-3"
          style={{fontSize: isTV ? 28 : 20}}>
          Search
        </Text>
        <View className="flex-row items-center space-x-3 mb-2">
          <View className="flex-1">
            <View
              ref={searchInputRef}
              className="overflow-hidden rounded-xl bg-[#141414] shadow-lg shadow-black/50"
              {...(isTV && {
                nextFocusDown: findNodeHandle(firstItemRef.current) ?? undefined,
              })}>
              <View className="px-3 py-3">
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="search"
                    size={isTV ? 28 : 24}
                    color={primary}
                  />
                  <TextInput
                    className="flex-1 text-white ml-3"
                    style={{fontSize: isTV ? 18 : 16}}
                    placeholder="Search anime..."
                    placeholderTextColor="#666"
                    value={searchText}
                    focusable={isTV}
                    onChangeText={setSearchText}
                    onSubmitEditing={e => handleSearch(e.nativeEvent.text)}
                    returnKeyType="search"
                  />
                  {searchText.length > 0 && !isTV && (
                    <TouchableOpacity
                      onPress={() => setSearchText('')}
                      className="bg-gray-800/50 rounded-full p-2">
                      <Feather name="x" size={isTV ? 22 : 18} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </AnimatedContainer>

      {/* Search Results */}
      <AnimatedContainer
        layout={isTV ? undefined : Layout.springify()}
        className="flex-1"
        key={
          searchResults.length > 0
            ? 'results'
            : searchHistory.length > 0
              ? 'history'
              : 'empty'
        }>
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.imdbID.toString()}
            renderItem={({item, index}) => (
              <TVFocusableResultItem item={item} index={index} />
            )}
            contentContainerStyle={{
              paddingTop: 4,
              paddingHorizontal: isTV ? 0 : 0,
            }}
            showsVerticalScrollIndicator={false}
          />
        ) : searchHistory.length > 0 ? (
          <AnimatedContainer
            entering={isTV ? undefined : SlideInRight.springify()}
            layout={isTV ? undefined : Layout.springify()}
            className="px-4 flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-white/90 font-semibold"
                style={{fontSize: isTV ? 18 : 16}}>
                Recent Searches
              </Text>
              <TVFocusableClearButton />
            </View>

            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `history-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 20}}
              renderItem={({item: search, index}) => (
                <TVFocusableHistoryItem search={search} index={index} />
              )}
            />
          </AnimatedContainer>
        ) : (
          // Empty State - Only show when no history and no results
          <AnimatedContainer
            layout={isTV ? undefined : Layout.springify()}
            className="items-center justify-center flex-1">
            <View className="bg-white/5 rounded-full p-6 mb-4">
              <Ionicons name="search" size={isTV ? 48 : 32} color={primary} />
            </View>
            <Text
              className="text-white/70 text-center"
              style={{fontSize: isTV ? 18 : 16}}>
              Search for your favorite anime
            </Text>
            <Text
              className="text-white/40 text-center mt-1"
              style={{fontSize: isTV ? 16 : 14}}>
              Your recent searches will appear here
            </Text>
          </AnimatedContainer>
        )}
      </AnimatedContainer>
    </SafeAreaView>
  );
};

export default Search;
