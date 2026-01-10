import {
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Dimensions,
  ToastAndroid,
  View,
  Platform,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {Stream} from '../lib/providers/types';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import SkeletonLoader from './Skeleton';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {Clipboard} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';
import {TextTrackType} from 'react-native-video';
import {settingsStorage} from '../lib/storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const isTV = Platform.isTV;

// TV Focusable Tab Button
const TVFocusableTab = ({
  label,
  isActive,
  onPress,
  primary,
  hasTVPreferredFocus = false,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  primary: string;
  hasTVPreferredFocus?: boolean;
}) => {
  const backgroundColor = useSharedValue(
    isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
  );
  const borderBottomWidth = useSharedValue(isActive ? 2 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    borderBottomWidth: borderBottomWidth.value,
    borderBottomColor: 'white',
  }));

  if (isTV) {
    return (
      <Pressable
        onPress={onPress}
        onFocus={() => {
          backgroundColor.value = withTiming('rgba(255,255,255,0.2)', {
            duration: 150,
          });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming(
            isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            {duration: 150},
          );
        }}
        hasTVPreferredFocus={hasTVPreferredFocus}
        isTVSelectable={true}>
        <Animated.View
          style={[
            animatedStyle,
            {
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
            },
          ]}>
          <Text
            style={{
              color: isActive ? primary : 'white',
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'center',
            }}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Text
      className={'text-lg p-1 font-semibold text-center'}
      style={{
        color: isActive ? primary : 'white',
        borderBottomWidth: isActive ? 2 : 0,
        borderBottomColor: isActive ? 'white' : 'transparent',
      }}
      onPress={onPress}>
      {label}
    </Text>
  );
};

// TV Focusable Item
const TVFocusableItem = ({
  label,
  onPress,
  onLongPress,
  primary,
  index,
  isFirstInList = false,
}: {
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  primary: string;
  index: number;
  isFirstInList?: boolean;
}) => {
  const backgroundColor = useSharedValue('rgba(255,255,255,0.3)');
  const borderLeftWidth = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    borderLeftWidth: borderLeftWidth.value,
    borderLeftColor: primary,
  }));

  if (isTV) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onFocus={() => {
          backgroundColor.value = withTiming('rgba(255,255,255,0.5)', {
            duration: 150,
          });
          borderLeftWidth.value = withTiming(4, {duration: 150});
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('rgba(255,255,255,0.3)', {
            duration: 150,
          });
          borderLeftWidth.value = withTiming(0, {duration: 150});
        }}
        hasTVPreferredFocus={isFirstInList && index === 0}
        isTVSelectable={true}>
        <Animated.View
          style={[
            animatedStyle,
            {
              padding: 8,
              borderRadius: 8,
              marginVertical: 4,
            },
          ]}>
          <Text style={{color: 'white', fontSize: 16}}>{label}</Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      className="p-2 bg-white/30 rounded-md my-1"
      onPress={onPress}
      onLongPress={onLongPress}>
      <Text style={{color: 'white'}}>{label}</Text>
    </TouchableOpacity>
  );
};

type Props = {
  data: Stream[];
  loading: boolean;
  title: string;
  showModal: boolean;
  setModal: (value: boolean) => void;
  onPressVideo: (item: any) => void;
  onPressSubs: (item: any) => void;
};
const DownloadBottomSheet = ({
  data,
  loading,
  showModal,
  setModal,
  title,
  onPressSubs,
  onPressVideo,
}: Props) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {primary} = useThemeStore(state => state);
  const [activeTab, setActiveTab] = React.useState<1 | 2>(1);

  const subtitle = data.map(server => {
    if (server.subtitles && server.subtitles.length > 0) {
      return server.subtitles;
    }
  });
  useEffect(() => {
    if (showModal) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [showModal]);
  return (
    <Modal
      onRequestClose={() => {
        bottomSheetRef.current?.close();
      }}
      visible={showModal}
      transparent={true}>
      <GestureHandlerRootView>
        <Pressable
          onPress={() => bottomSheetRef.current?.close()}
          className="flex-1">
          <BottomSheet
            // detached={true}
            enablePanDownToClose={true}
            snapPoints={isTV ? ['100%'] : ['30%', 450]}
            containerStyle={{marginHorizontal: 5}}
            ref={bottomSheetRef}
            backgroundStyle={{backgroundColor: '#1a1a1a'}}
            handleIndicatorStyle={{backgroundColor: '#333'}}
            onClose={() => setModal(false)}>
            <Pressable className="flex-1" onPress={e => e.stopPropagation()}>
              <Text className="text-white text-xl p-1 font-semibold text-center">
                {title}
              </Text>
              <BottomSheetScrollView
                style={{padding: 5, marginBottom: 5}}
                showsVerticalScrollIndicator={false}>
                {subtitle &&
                  subtitle.length > 0 &&
                  subtitle[0] !== undefined && (
                    <View className="flex-row items-center justify-center gap-x-3 w-full my-5">
                      <TVFocusableTab
                        label="Video"
                        isActive={activeTab === 1}
                        onPress={() => setActiveTab(1)}
                        primary={primary}
                        hasTVPreferredFocus={!loading && isTV}
                      />
                      <TVFocusableTab
                        label="Subtitle"
                        isActive={activeTab === 2}
                        onPress={() => setActiveTab(2)}
                        primary={primary}
                      />
                    </View>
                  )}
                {loading
                  ? Array.from({length: 4}).map((_, index) => (
                      <SkeletonLoader
                        key={index}
                        width={Dimensions.get('window').width - 30}
                        height={35}
                        marginVertical={5}
                      />
                    ))
                  : activeTab === 1
                    ? data.map((item, index) => (
                        <TVFocusableItem
                          key={item.link}
                          label={item.server}
                          index={index}
                          isFirstInList={
                            !subtitle ||
                            subtitle.length === 0 ||
                            subtitle[0] === undefined
                          }
                          onPress={() => {
                            onPressVideo(item);
                            bottomSheetRef.current?.close();
                          }}
                          onLongPress={() => {
                            if (settingsStorage.isHapticFeedbackEnabled()) {
                              RNReactNativeHapticFeedback.trigger(
                                'effectTick',
                                {
                                  enableVibrateFallback: true,
                                  ignoreAndroidSystemSettings: false,
                                },
                              );
                            }
                            Clipboard.setString(item.link);
                            ToastAndroid.show(
                              'Link copied',
                              ToastAndroid.SHORT,
                            );
                          }}
                          primary={primary}
                        />
                      ))
                    : subtitle.length > 0
                      ? subtitle.map(subs =>
                          subs?.map((item, index) => (
                            <TVFocusableItem
                              key={item.uri}
                              label={`${item.language} - ${item.title}`}
                              index={index}
                              isFirstInList={true}
                              onPress={() => {
                                onPressSubs({
                                  server: 'Subtitles',
                                  link: item.uri,
                                  type:
                                    item.type === TextTrackType.VTT
                                      ? 'vtt'
                                      : 'srt',
                                  title: item.title,
                                });
                                bottomSheetRef.current?.close();
                              }}
                              onLongPress={() => {
                                if (settingsStorage.isHapticFeedbackEnabled()) {
                                  RNReactNativeHapticFeedback.trigger(
                                    'effectTick',
                                    {
                                      enableVibrateFallback: true,
                                      ignoreAndroidSystemSettings: false,
                                    },
                                  );
                                }
                                Clipboard.setString(item.uri);
                                ToastAndroid.show(
                                  'Link copied',
                                  ToastAndroid.SHORT,
                                );
                              }}
                              primary={primary}
                            />
                          )),
                        )
                      : null}
                {data.length === 0 && !loading && (
                  <Text className="text-red-500 text-lg text-center">
                    No server found
                  </Text>
                )}
              </BottomSheetScrollView>
            </Pressable>
          </BottomSheet>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default DownloadBottomSheet;
