import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
  StatusBar,
  Platform,
  Pressable,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {settingsStorage} from '../../lib/storage';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useThemeStore from '../../lib/zustand/themeStore';
import {Dropdown} from 'react-native-element-dropdown';
import {themes} from '../../lib/constants';
import {TextInput} from 'react-native';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const isTV = Platform.isTV;
// Lazy-load Firebase to allow running without google-services.json
const getAnalytics = (): any | null => {
  try {
    return require('@react-native-firebase/analytics').default;
  } catch {
    return null;
  }
};
const getCrashlytics = (): any | null => {
  try {
    return require('@react-native-firebase/crashlytics').default;
  } catch {
    return null;
  }
};

// TV Focusable Switch Row Component
const TVFocusableSwitchRow = ({
  label,
  value,
  onValueChange,
  primary,
  hasBorder = true,
  isFirst = false,
}: {
  label: string;
  value: boolean;
  onValueChange: () => void;
  primary: string;
  hasBorder?: boolean;
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
        onPress={onValueChange}
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
              borderBottomWidth: hasBorder ? 1 : 0,
              borderBottomColor: '#262626',
            },
          ]}>
          <Text style={{color: 'white', fontSize: 16}}>{label}</Text>
          <Switch
            thumbColor={value ? primary : 'gray'}
            value={value}
            onValueChange={onValueChange}
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View
      className="flex-row items-center justify-between p-4"
      style={{
        borderBottomWidth: hasBorder ? 1 : 0,
        borderBottomColor: '#262626',
      }}>
      <Text className="text-white text-base">{label}</Text>
      <Switch
        thumbColor={value ? primary : 'gray'}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
};

// TV Focusable Quality Button Component
const TVFocusableQualityButton = ({
  quality,
  isExcluded,
  onPress,
  primary,
}: {
  quality: string;
  isExcluded: boolean;
  onPress: () => void;
  primary: string;
}) => {
  const borderWidth = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor: 'white',
  }));

  if (isTV) {
    return (
      <Pressable
        onPress={onPress}
        onFocus={() => {
          borderWidth.value = withTiming(2, {duration: 150});
        }}
        onBlur={() => {
          borderWidth.value = withTiming(0, {duration: 150});
        }}
        isTVSelectable={true}>
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: isExcluded ? primary : '#262626',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginRight: 8,
              marginBottom: 8,
            },
          ]}>
          <Text style={{color: 'white', fontSize: 14}}>{quality}</Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isExcluded ? primary : '#262626',
      }}
      className="px-4 py-2 rounded-lg mr-2 mb-2">
      <Text className="text-white text-sm">{quality}</Text>
    </TouchableOpacity>
  );
};

const Preferences = () => {
  const hasFirebase = Boolean(Constants?.expoConfig?.extra?.hasFirebase);
  const {primary, setPrimary, isCustom, setCustom} = useThemeStore(
    state => state,
  );
  const [showRecentlyWatched, setShowRecentlyWatched] = useState(
    settingsStorage.getBool('showRecentlyWatched') || false,
  );
  const [disableDrawer, setDisableDrawer] = useState(
    settingsStorage.getBool('disableDrawer') || false,
  );

  const [ExcludedQualities, setExcludedQualities] = useState(
    settingsStorage.getExcludedQualities(),
  );

  const [customColor, setCustomColor] = useState(
    settingsStorage.getCustomColor(),
  );

  const [showMediaControls, setShowMediaControls] = useState<boolean>(
    settingsStorage.showMediaControls(),
  );

  const [showHamburgerMenu, setShowHamburgerMenu] = useState<boolean>(
    settingsStorage.showHamburgerMenu(),
  );

  const [hideSeekButtons, setHideSeekButtons] = useState<boolean>(
    settingsStorage.hideSeekButtons(),
  );

  const [_enable2xGesture, _setEnable2xGesture] = useState<boolean>(
    settingsStorage.isEnable2xGestureEnabled(),
  );

  const [enableSwipeGesture, setEnableSwipeGesture] = useState<boolean>(
    settingsStorage.isSwipeGestureEnabled(),
  );

  const [showTabBarLables, setShowTabBarLables] = useState<boolean>(
    settingsStorage.showTabBarLabels(),
  );

  const [OpenExternalPlayer, setOpenExternalPlayer] = useState(
    settingsStorage.getBool('useExternalPlayer', false),
  );

  const [hapticFeedback, setHapticFeedback] = useState(
    settingsStorage.isHapticFeedbackEnabled(),
  );

  const [alwaysUseExternalDownload, setAlwaysUseExternalDownload] = useState(
    settingsStorage.getBool('alwaysExternalDownloader') || false,
  );

  const [telemetryOptIn, setTelemetryOptIn] = useState<boolean>(
    settingsStorage.isTelemetryOptIn(),
  );

  const handleTelemetryChange = useCallback(async () => {
    const next = !telemetryOptIn;
    setTelemetryOptIn(next);
    settingsStorage.setTelemetryOptIn(next);
    if (hasFirebase) {
      try {
        const crashlytics = getCrashlytics();
        crashlytics &&
          (await crashlytics().setCrashlyticsCollectionEnabled(next));
      } catch {}
      try {
        const analytics = getAnalytics();
        analytics && (await analytics().setAnalyticsCollectionEnabled(next));
        analytics &&
          (await analytics().setConsent({
            analytics_storage: next,
            ad_storage: next,
            ad_user_data: next,
            ad_personalization: next,
          }));
      } catch {}
    }
  }, [telemetryOptIn, hasFirebase]);

  return (
    <ScrollView
      className="w-full h-full bg-black"
      contentContainerStyle={{
        paddingTop: StatusBar.currentHeight || 0,
        paddingBottom: isTV ? 50 : 0,
      }}>
      <View className="p-5">
        <Text
          style={{
            fontSize: isTV ? 28 : 24,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
          }}>
          Preferences
        </Text>

        {/* Theme Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-3">Appearance</Text>
          <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
            {/* Theme Selector - Non-TV only for now due to dropdown */}
            {!isTV && (
              <View className="flex-row items-center px-4 justify-between p-4 border-b border-[#262626]">
                <Text className="text-white text-base">Theme</Text>
                <View className="w-36">
                  {isCustom ? (
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        style={{
                          color: 'white',
                          backgroundColor: '#262626',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          fontSize: 14,
                        }}
                        placeholder="Hex Color"
                        placeholderTextColor="gray"
                        value={customColor}
                        onChangeText={setCustomColor}
                        onSubmitEditing={e => {
                          if (e.nativeEvent.text.length < 7) {
                            ToastAndroid.show(
                              'Invalid Color',
                              ToastAndroid.SHORT,
                            );
                            return;
                          }
                          settingsStorage.setCustomColor(e.nativeEvent.text);
                          setPrimary(e.nativeEvent.text);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          setCustom(false);
                          setPrimary('#FF6347');
                        }}>
                        <MaterialCommunityIcons
                          name="close"
                          size={20}
                          color="gray"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Dropdown
                      selectedTextStyle={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                      containerStyle={{
                        backgroundColor: '#262626',
                        borderRadius: 8,
                        borderWidth: 0,
                        marginTop: 4,
                      }}
                      itemTextStyle={{color: 'white'}}
                      activeColor="#3A3A3A"
                      itemContainerStyle={{
                        backgroundColor: '#262626',
                        borderWidth: 0,
                      }}
                      style={{
                        backgroundColor: '#262626',
                        borderWidth: 0,
                      }}
                      iconStyle={{tintColor: 'white'}}
                      placeholderStyle={{color: 'white'}}
                      labelField="name"
                      valueField="color"
                      data={themes}
                      value={primary}
                      onChange={value => {
                        if (value.name === 'Custom') {
                          setCustom(true);
                          setPrimary(customColor);
                          return;
                        }
                        setPrimary(value.color);
                      }}
                    />
                  )}
                </View>
              </View>
            )}

            {/* Haptic Feedback */}
            <TVFocusableSwitchRow
              label="Haptic Feedback"
              value={hapticFeedback}
              onValueChange={() => {
                settingsStorage.setHapticFeedbackEnabled(!hapticFeedback);
                setHapticFeedback(!hapticFeedback);
              }}
              primary={primary}
              isFirst={isTV}
            />

            {/* Analytics & Crashlytics Opt-In */}
            <TVFocusableSwitchRow
              label="Usage & Crash Reports"
              value={telemetryOptIn}
              onValueChange={handleTelemetryChange}
              primary={primary}
            />

            {/* Show Tab Bar Labels */}
            <TVFocusableSwitchRow
              label="Show Tab Bar Labels"
              value={showTabBarLables}
              onValueChange={() => {
                settingsStorage.setShowTabBarLabels(!showTabBarLables);
                setShowTabBarLables(!showTabBarLables);
                ToastAndroid.show(
                  'Restart App to Apply Changes',
                  ToastAndroid.SHORT,
                );
              }}
              primary={primary}
            />

            {/* Show Hamburger Menu */}
            {!isTV && (
              <TVFocusableSwitchRow
                label="Show Hamburger Menu"
                value={showHamburgerMenu}
                onValueChange={() => {
                  settingsStorage.setShowHamburgerMenu(!showHamburgerMenu);
                  setShowHamburgerMenu(!showHamburgerMenu);
                }}
                primary={primary}
              />
            )}

            {/* Show Recently Watched */}
            <TVFocusableSwitchRow
              label="Show Recently Watched"
              value={showRecentlyWatched}
              onValueChange={() => {
                settingsStorage.setBool(
                  'showRecentlyWatched',
                  !showRecentlyWatched,
                );
                setShowRecentlyWatched(!showRecentlyWatched);
              }}
              primary={primary}
            />

            {/* Disable Drawer */}
            {!isTV && (
              <TVFocusableSwitchRow
                label="Disable Drawer"
                value={disableDrawer}
                onValueChange={() => {
                  settingsStorage.setBool('disableDrawer', !disableDrawer);
                  setDisableDrawer(!disableDrawer);
                }}
                primary={primary}
              />
            )}

            {/* Always Use External Downloader */}
            <TVFocusableSwitchRow
              label="Always Use External Downloader"
              value={alwaysUseExternalDownload}
              onValueChange={() => {
                settingsStorage.setBool(
                  'alwaysExternalDownloader',
                  !alwaysUseExternalDownload,
                );
                setAlwaysUseExternalDownload(!alwaysUseExternalDownload);
              }}
              primary={primary}
              hasBorder={false}
            />
          </View>
        </View>

        {/* Player Settings */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-3">Player</Text>
          <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
            {/* External Player */}
            <TVFocusableSwitchRow
              label="Always Use External Player"
              value={OpenExternalPlayer}
              onValueChange={() => {
                settingsStorage.setBool(
                  'useExternalPlayer',
                  !OpenExternalPlayer,
                );
                setOpenExternalPlayer(!OpenExternalPlayer);
              }}
              primary={primary}
            />

            {/* Media Controls */}
            <TVFocusableSwitchRow
              label="Media Controls"
              value={showMediaControls}
              onValueChange={() => {
                settingsStorage.setShowMediaControls(!showMediaControls);
                setShowMediaControls(!showMediaControls);
              }}
              primary={primary}
            />

            {/* Hide Seek Buttons */}
            <TVFocusableSwitchRow
              label="Hide Seek Buttons"
              value={hideSeekButtons}
              onValueChange={() => {
                settingsStorage.setHideSeekButtons(!hideSeekButtons);
                setHideSeekButtons(!hideSeekButtons);
              }}
              primary={primary}
            />

            {/* Swipe Gestures */}
            {!isTV && (
              <TVFocusableSwitchRow
                label="Enable Swipe Gestures"
                value={enableSwipeGesture}
                onValueChange={() => {
                  settingsStorage.setSwipeGestureEnabled(!enableSwipeGesture);
                  setEnableSwipeGesture(!enableSwipeGesture);
                }}
                primary={primary}
                hasBorder={false}
              />
            )}
          </View>
        </View>

        {/* Quality Settings */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-3">Quality</Text>
          <View className="bg-[#1A1A1A] rounded-xl p-4">
            <Text className="text-white text-base mb-3">
              Excluded Qualities
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {['360p', '480p', '720p'].map((quality, index) => (
                <TVFocusableQualityButton
                  key={index}
                  quality={quality}
                  isExcluded={ExcludedQualities.includes(quality)}
                  onPress={() => {
                    if (settingsStorage.isHapticFeedbackEnabled()) {
                      RNReactNativeHapticFeedback.trigger('effectTick');
                    }
                    const newExcluded = ExcludedQualities.includes(quality)
                      ? ExcludedQualities.filter(q => q !== quality)
                      : [...ExcludedQualities, quality];
                    setExcludedQualities(newExcluded);
                    settingsStorage.setExcludedQualities(newExcluded);
                  }}
                  primary={primary}
                />
              ))}
            </View>
          </View>
        </View>

        <View className="h-16" />
      </View>
    </ScrollView>
  );
};

export default Preferences;
