import {
  View,
  Text,
  Platform,
  Image,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {WatchListStackParamList} from '../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {TouchableOpacity} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';
import useWatchListStore from '../lib/zustand/watchListStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {StatusBar} from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// TV-specific constants
const isTV = Platform.isTV;
const TV_FOCUS_SCALE = 1.03;

// TV-optimized watchlist item component
const TVWatchListItem = ({
  item,
  index,
  itemWidth,
  primary,
  onPress,
  // numColumns,
}: {
  item: any;
  index: number;
  itemWidth: number;
  primary: string;
  onPress: () => void;
  numColumns: number;
}) => {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const handleFocus = useCallback(() => {
    scale.value = withTiming(TV_FOCUS_SCALE, {duration: 150});
    borderOpacity.value = withTiming(1, {duration: 150});
  }, []);

  const handleBlur = useCallback(() => {
    scale.value = withTiming(1, {duration: 150});
    borderOpacity.value = withTiming(0, {duration: 150});
  }, []);

  if (isTV) {
    return (
      <View
        style={{
          width: itemWidth,
          marginBottom: 24,
          alignItems: 'center',
          paddingVertical: 14,
        }}>
        <Pressable
          onPress={onPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          hasTVPreferredFocus={index === 0}
          isTVSelectable={true}>
          <Animated.View style={[animatedStyle, {alignItems: 'center'}]}>
            <View style={{position: 'relative', width: itemWidth}}>
              <Image
                style={{
                  width: itemWidth,
                  height: itemWidth * 1.5,
                  borderRadius: 8,
                }}
                source={{uri: item.poster}}
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
                    borderRadius: 11,
                  },
                  borderAnimatedStyle,
                ]}
                pointerEvents="none"
              />
            </View>
            <Text
              style={{
                color: 'white',
                fontSize: 14,
                textAlign: 'center',
                marginTop: 8,
                width: itemWidth - 16,
              }}
              numberOfLines={2}>
              {item.title}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    );
  }

  // Non-TV rendering
  return (
    <TouchableOpacity
      key={item.link + index}
      onPress={onPress}
      style={{
        width: itemWidth,
        marginBottom: 16,
      }}>
      <View className="relative overflow-hidden">
        <Image
          className="rounded-xl"
          resizeMode="cover"
          style={{
            width: itemWidth,
            height: 155,
            borderRadius: 10,
          }}
          source={{uri: item.poster}}
        />
        <Text
          className="text-white text-xs truncate text-center mt-1"
          style={{maxWidth: itemWidth}}
          numberOfLines={1}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const WatchList = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<WatchListStackParamList>>();
  const {watchList} = useWatchListStore(state => state);
  const [contentWidth, setContentWidth] = useState(Dimensions.get('window').width);

  // Calculate how many items can fit per row
  const containerPadding = isTV ? 48 : 12; // Larger padding for TV to account for scale
  const itemSpacing = 10;

  // Available width for the grid
  const availableWidth = contentWidth - containerPadding * 2;

  // Determine number of columns and adjusted item width
  const numColumns = isTV
    ? Math.max(
        3,
        Math.floor((availableWidth + itemSpacing) / (150 + itemSpacing)),
      )
    : Math.floor((availableWidth + itemSpacing) / (100 + itemSpacing));

  // Calculate the actual item width to fill the space exactly
  const itemWidth =
    (availableWidth - itemSpacing * (numColumns - 1)) / numColumns;

  // Render each grid item
  const renderItem = useCallback(
    ({item, index}: {item: any; index: number}) => (
      <TVWatchListItem
        item={item}
        index={index}
        itemWidth={itemWidth}
        primary={primary}
        numColumns={numColumns}
        onPress={() =>
          navigation.navigate('Info', {
            link: item.link,
            provider: item.provider,
            poster: item.poster,
          })
        }
      />
    ),
    [itemWidth, primary, navigation, numColumns],
  );

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <StatusBar translucent backgroundColor="transparent" />

      <View
        className="w-full bg-black"
        style={{
          paddingTop: Platform.OS === 'android' ? 15 : 0, // Adjust for Android status bar height
        }}
      />

      <View 
        className="flex-1 w-full px-3"
        onLayout={(event) => {
          const {width} = event.nativeEvent.layout;
          setContentWidth(width);
        }}>
        <Text
          style={{
            color: primary,
            fontSize: isTV ? 32 : 24,
            fontWeight: 'bold',
            marginBottom: 24,
            marginTop: 16,
            textAlign: 'center',
          }}
          className={isTV ? '' : 'text-2xl text-center font-bold mb-6 mt-4'}>
          Watchlist
        </Text>

        {watchList.length > 0 ? (
          <FlatList
            key={`grid-${numColumns}`}
            data={watchList}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.link + index}
            numColumns={numColumns}
            columnWrapperStyle={{
              gap: itemSpacing,
              justifyContent: 'flex-start',
            }}
            contentContainerStyle={{
              paddingBottom: 50,
              paddingHorizontal: isTV ? 16 : 0,
            }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={!isTV}
          />
        ) : (
          <View className="flex-1">
            <View className="items-center justify-center mt-20 mb-12">
              <MaterialCommunityIcons
                name="playlist-remove"
                size={isTV ? 100 : 80}
                color={primary}
              />
              <Text
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: isTV ? 18 : 14,
                  marginTop: 16,
                  textAlign: 'center',
                }}>
                Your WatchList is empty
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default WatchList;
