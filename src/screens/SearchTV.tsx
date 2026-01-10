import {View, Text, FlatList, Pressable, TextInput} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import {MaterialIcons, Ionicons} from '@expo/vector-icons';
import useThemeStore from '../lib/zustand/themeStore';
import {MMKV} from '../lib/Mmkv';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const MAX_HISTORY_ITEMS = 30;

const SearchTV = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [searchText, setSearchText] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(
    MMKV.getArray<string>('searchHistory') || [],
  );

  const handleSearch = (text: string) => {
    if (text.trim()) {
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

  const clearHistory = () => {
    MMKV.setArray('searchHistory', []);
    setSearchHistory([]);
  };

  const HistoryItem = ({search}: {search: string}) => {
    const backgroundColor = useSharedValue('transparent');
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: backgroundColor.value,
      transform: [{scale: scale.value}],
    }));

    return (
      <Pressable
        onPress={() => handleSearch(search)}
        onFocus={() => {
          backgroundColor.value = withTiming('rgba(255,255,255,0.1)', {
            duration: 150,
          });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('transparent', {duration: 150});
          scale.value = withTiming(1, {duration: 150});
        }}
        focusable={true}>
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: '#1a1a1a',
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 20,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            },
          ]}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 25,
              padding: 8,
              marginRight: 16,
            }}>
            <Ionicons name="time-outline" size={20} color={primary} />
          </View>
          <Text style={{color: 'white', fontSize: 18, flex: 1}}>{search}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#666" />
        </Animated.View>
      </Pressable>
    );
  };

  const ClearButton = () => {
    const backgroundColor = useSharedValue('rgba(239,68,68,0.15)');
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: backgroundColor.value,
      transform: [{scale: scale.value}],
    }));

    return (
      <Pressable
        onPress={clearHistory}
        onFocus={() => {
          backgroundColor.value = withTiming('rgba(239,68,68,0.3)', {
            duration: 150,
          });
          scale.value = withTiming(1.05, {duration: 150});
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('rgba(239,68,68,0.15)', {
            duration: 150,
          });
          scale.value = withTiming(1, {duration: 150});
        }}
        focusable={true}>
        <Animated.View
          style={[
            animatedStyle,
            {
              borderRadius: 25,
              paddingHorizontal: 20,
              paddingVertical: 10,
            },
          ]}>
          <Text style={{color: '#ef4444', fontSize: 16, fontWeight: '600'}}>
            Clear All
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
      <View style={{flex: 1, paddingHorizontal: 32, paddingTop: 20}}>
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 32,
            marginBottom: 24,
          }}>
          Search
        </Text>

        <View
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingVertical: 16,
            marginBottom: 32,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <MaterialIcons name="search" size={32} color={primary} />
          <TextInput
            style={{
              flex: 1,
              color: 'white',
              fontSize: 20,
              marginLeft: 16,
            }}
            hasTVPreferredFocus={true}
            placeholder="Search anime..."
            placeholderTextColor="#666"
            value={searchText}
            focusable={true}
            onChangeText={setSearchText}
            onSubmitEditing={e => handleSearch(e.nativeEvent.text)}
            returnKeyType="search"
          />
        </View>

        {searchHistory.length > 0 ? (
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 20,
                  fontWeight: '600',
                }}>
                Recent Searches
              </Text>
              <ClearButton />
            </View>

            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `history-${index}`}
              showsVerticalScrollIndicator={false}
              renderItem={({item: search}) => <HistoryItem search={search} />}
            />
          </>
        ) : (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 100,
                padding: 32,
                marginBottom: 20,
              }}>
              <Ionicons name="search-outline" size={64} color={primary} />
            </View>
            <Text
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 20,
                textAlign: 'center',
              }}>
              Search for your favorite anime
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 8,
              }}>
              Your recent searches will appear here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SearchTV;
