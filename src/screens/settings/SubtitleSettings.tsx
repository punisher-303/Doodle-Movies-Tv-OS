import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TouchableNativeFeedback,
  Platform,
  Pressable,
} from 'react-native';
import React from 'react';
import {startActivityAsync, ActivityAction} from 'expo-intent-launcher';
import {ScrollView} from 'moti';
import {settingsStorage} from '../../lib/storage';
import useThemeStore from '../../lib/zustand/themeStore';
import {Feather, Entypo} from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const isTV = Platform.isTV;

// TV Focusable Adjuster Row Component
const TVFocusableAdjusterRow = ({
  label,
  value,
  onIncrease,
  onDecrease,
  primary,
  isFirst = false,
}: {
  label: string;
  value: number | string;
  onIncrease: () => void;
  onDecrease: () => void;
  primary: string;
  isFirst?: boolean;
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
        hasTVPreferredFocus={isFirst}
        isTVSelectable={true}>
        <Animated.View
          style={[
            animatedStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#262626',
            },
          ]}>
          <Text style={{color: 'white', fontSize: 16}}>{label}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
            <Pressable onPress={onDecrease} isTVSelectable={true}>
              <Entypo name="minus" size={23} color={primary} />
            </Pressable>
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                backgroundColor: '#262626',
                paddingHorizontal: 12,
                borderRadius: 6,
                width: 48,
                textAlign: 'center',
              }}>
              {value}
            </Text>
            <Pressable onPress={onIncrease} isTVSelectable={true}>
              <Entypo name="plus" size={23} color={primary} />
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
      <Text className="text-white text-base">{label}</Text>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={onDecrease}>
          <Entypo name="minus" size={23} color={primary} />
        </TouchableOpacity>
        <Text className="text-white text-base bg-[#262626] px-3 rounded-md w-12 text-center">
          {value}
        </Text>
        <TouchableOpacity onPress={onIncrease}>
          <Entypo name="plus" size={23} color={primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// TV Focusable Menu Item Component
const TVFocusableMenuItem = ({
  onPress,
  label,
  primary,
}: {
  onPress: () => void;
  label: string;
  primary: string;
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
        onPress={onPress}
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
        isTVSelectable={true}>
        <Animated.View
          style={[
            animatedStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#262626',
            },
          ]}>
          <Text style={{color: 'white', fontSize: 16}}>{label}</Text>
          <Feather name="chevron-right" size={20} color="gray" />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      background={TouchableNativeFeedback.Ripple('#333333', false)}>
      <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
        <View className="flex-row items-center">
          <Text className="text-white text-base">{label}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="gray" />
      </View>
    </TouchableNativeFeedback>
  );
};

const SubtitlePreference = () => {
  const [fontSize, setFontSize] = React.useState(
    settingsStorage.getSubtitleFontSize(),
  );
  const [opacity, setOpacity] = React.useState(
    settingsStorage.getSubtitleOpacity(),
  );
  const [bottomElevation, setBottomElevation] = React.useState(
    settingsStorage.getSubtitleBottomPadding(),
  );
  const {primary} = useThemeStore();

  const handleSubtitleSize = (action: 'increase' | 'decrease') => {
    if (fontSize < 5 || fontSize > 30) return;
    if (action === 'increase') {
      const newSize = Math.min(fontSize + 1, 30);
      settingsStorage.setSubtitleFontSize(newSize);
      setFontSize(newSize);
    }
    if (action === 'decrease') {
      const newSize = Math.max(fontSize - 1, 10);
      settingsStorage.setSubtitleFontSize(newSize);
      setFontSize(newSize);
    }
  };

  const handleSubtitleOpacity = (action: 'increase' | 'decrease') => {
    if (action === 'increase') {
      const newOpacity = Math.min(opacity + 0.1, 1).toFixed(1);
      settingsStorage.setSubtitleOpacity(parseFloat(newOpacity));
      setOpacity(parseFloat(newOpacity));
    }
    if (action === 'decrease') {
      const newOpacity = Math.max(opacity - 0.1, 0).toFixed(1);
      settingsStorage.setSubtitleOpacity(parseFloat(newOpacity));
      setOpacity(parseFloat(newOpacity));
    }
  };

  const handleSubtitleBottomPadding = (action: 'increase' | 'decrease') => {
    if (bottomElevation < 0 || bottomElevation > 99) return;
    if (action === 'increase') {
      const newPadding = Math.min(bottomElevation + 1, 99);
      settingsStorage.setSubtitleBottomPadding(newPadding);
      setBottomElevation(newPadding);
    }
    if (action === 'decrease') {
      const newPadding = Math.max(bottomElevation - 1, 0);
      settingsStorage.setSubtitleBottomPadding(newPadding);
      setBottomElevation(newPadding);
    }
  };

  return (
    <ScrollView
      className="w-full h-full bg-black"
      contentContainerStyle={{
        paddingTop: StatusBar.currentHeight || 0,
        paddingBottom: isTV ? 50 : 0,
      }}>
      <View className="p-5" style={isTV ? {paddingHorizontal: 24} : undefined}>
        <Text
          style={{
            fontSize: isTV ? 28 : 24,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
          }}>
          Subtitle Preferences
        </Text>

        <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
          <TVFocusableAdjusterRow
            label="Font Size"
            value={fontSize}
            onIncrease={() => handleSubtitleSize('increase')}
            onDecrease={() => handleSubtitleSize('decrease')}
            primary={primary}
            isFirst={true}
          />

          {/* opacity */}
          <TVFocusableAdjusterRow
            label="Opacity"
            value={opacity}
            onIncrease={() => handleSubtitleOpacity('increase')}
            onDecrease={() => handleSubtitleOpacity('decrease')}
            primary={primary}
          />

          {/* bottom padding */}
          <TVFocusableAdjusterRow
            label="Bottom Elevation"
            value={bottomElevation}
            onIncrease={() => handleSubtitleBottomPadding('increase')}
            onDecrease={() => handleSubtitleBottomPadding('decrease')}
            primary={primary}
          />

          {/* More Settings - Android only */}
          {!isTV && (
            <TVFocusableMenuItem
              onPress={async () => {
                await startActivityAsync(ActivityAction.CAPTIONING_SETTINGS);
              }}
              label="More Subtitle Settings"
              primary={primary}
            />
          )}

          {/* reset */}
          <View
            className="flex-row items-center justify-between p-4 border-b border-[#262626]"
            style={isTV ? {paddingVertical: 16} : undefined}>
            <Text className="text-white text-base">Reset to Default</Text>
            {isTV ? (
              <Pressable
                onPress={() => {
                  settingsStorage.setSubtitleFontSize(16);
                  settingsStorage.setSubtitleOpacity(1);
                  settingsStorage.setSubtitleBottomPadding(10);
                  setFontSize(16);
                  setOpacity(1);
                  setBottomElevation(10);
                }}
                isTVSelectable={true}
                style={{
                  backgroundColor: '#262626',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}>
                <Text style={{color: 'white', fontSize: 16}}>Reset</Text>
              </Pressable>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  settingsStorage.setSubtitleFontSize(16);
                  settingsStorage.setSubtitleOpacity(1);
                  settingsStorage.setSubtitleBottomPadding(10);
                  setFontSize(16);
                  setOpacity(1);
                  setBottomElevation(10);
                }}>
                <View className="w-32 flex-row items-center justify-center">
                  <Text className="text-white text-base bg-[#262626] px-3 py-1 rounded-md text-center">
                    Reset
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View className="h-16" />
      </View>
    </ScrollView>
  );
};

export default SubtitlePreference;
