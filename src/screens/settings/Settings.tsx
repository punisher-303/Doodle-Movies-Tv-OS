import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  TouchableNativeFeedback,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
  Switch,
  TextInput,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  settingsStorage,
  cacheStorageService,
  extensionStorage,
  ProviderExtension,
} from '../../lib/storage';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useContentStore from '../../lib/zustand/contentStore';
import { socialLinks } from '../../lib/constants';
import {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { SettingsStackParamList, TabStackParamList } from '../../App';
import {
  MaterialCommunityIcons,
  AntDesign,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons';
import useThemeStore from '../../lib/zustand/themeStore';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';
import useAppModeStore from '../../lib/zustand/appModeStore';
import { RootStackParamList } from '../../App';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import RenderProviderFlagIcon from '../../components/RenderProviderFLagIcon';

const isTV = Platform.isTV;

// --- WATCH TOGETHER PERSISTENCE ---
const KEY_WATCH_TOGETHER = 'watchTogetherMode';

const getWatchTogetherMode = () => {
  const modeStr = cacheStorageService.getString(KEY_WATCH_TOGETHER);
  return modeStr === 'true' ? true : false;
};

const setWatchTogetherModeStorage = (mode: boolean) => {
  cacheStorageService.setString(KEY_WATCH_TOGETHER, String(mode));
};
// -----------------------------------------------------------

// --- NETWORK PROXY PERSISTENCE ---
const KEY_NETWORK_PROXY = 'networkProxyMode';

const getNetworkProxyMode = () => {
  const modeStr = cacheStorageService.getString(KEY_NETWORK_PROXY);
  return modeStr === 'true' ? true : false;
};

const setNetworkProxyModeStorage = (mode: boolean) => {
  cacheStorageService.setString(KEY_NETWORK_PROXY, String(mode));
};
// -----------------------------------------------------------

// TV Focusable Menu Item Component
const TVFocusableMenuItem = ({
  onPress,
  icon,
  iconColor: _iconColor,
  label,
  rightIcon = 'chevron-right',
  hasBorder = true,
  isFirst = false,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  rightIcon?: 'chevron-right' | 'external-link';
  hasBorder?: boolean;
  isFirst?: boolean;
}) => {
  const backgroundColor = useSharedValue('transparent');
  const borderLeftWidth = useSharedValue(0);
  const { primary } = useThemeStore(state => state);

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
          borderLeftWidth.value = withTiming(4, { duration: 150 });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('transparent', { duration: 150 });
          borderLeftWidth.value = withTiming(0, { duration: 150 });
        }}
        hasTVPreferredFocus={isFirst}
        focusable={true}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon}
            <Text style={{ color: 'white', marginLeft: 12, fontSize: 16 }}>
              {label}
            </Text>
          </View>
          <Feather name={rightIcon} size={20} color="gray" />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      background={TouchableNativeFeedback.Ripple('#333333', false)}>
      <View
        className="flex-row items-center justify-between p-4"
        style={{
          borderBottomWidth: hasBorder ? 1 : 0,
          borderBottomColor: '#262626',
        }}>
        <View className="flex-row items-center">
          {icon}
          <Text className="text-white ml-3 text-base">{label}</Text>
        </View>
        <Feather name={rightIcon} size={20} color="gray" />
      </View>
    </TouchableNativeFeedback>
  );
};

// TV Focusable Provider Item Component
const TVFocusableProviderItem = ({
  item,
  isSelected,
  onPress,
  primary,
  index,
}: {
  item: ProviderExtension;
  isSelected: boolean;
  onPress: () => void;
  primary: string;
  index: number;
}) => {
  const borderWidth = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor: primary,
  }));

  if (isTV) {
    return (
      <Pressable
        onPress={onPress}
        onFocus={() => {
          borderWidth.value = withTiming(3, { duration: 150 });
        }}
        onBlur={() => {
          borderWidth.value = withTiming(0, { duration: 150 });
        }}
        hasTVPreferredFocus={index === 0}
        isTVSelectable={true}
        style={{ marginRight: 12 }}>
        <Animated.View
          style={[
            animatedStyle,
            {
              width: 150,
              height: 80,
              borderRadius: 8,
              backgroundColor: isSelected ? '#333333' : '#262626',
            },
          ]}>
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              position: 'relative'
            }}>
            {/* Latency Dot */}
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: getLatencyColor(pingStatus[item.value])
              }}
            />
            <RenderProviderFlagIcon type={item.type} />
            <Text
              numberOfLines={1}
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 8,
              }}>
              {item.display_name}
            </Text>
            {isSelected && (
              <View style={{ position: 'absolute', top: 6, right: 6 }}>
                <MaterialIcons name="check-circle" size={16} color={primary} />
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      key={item.value}
      onPress={onPress}
      className={`mr-3 rounded-lg ${isSelected ? 'bg-[#333333]' : 'bg-[#262626]'
        }`}
      style={{
        width: Dimensions.get('window').width * 0.3,
        height: 65,
        borderWidth: 1.5,
        borderColor: isSelected ? primary : '#333333',
      }}>
      <View className="flex-col items-center justify-center h-full p-2">
        <RenderProviderFlagIcon type={item.type} />
        <Text
          numberOfLines={1}
          className="text-white text-xs font-medium text-center mt-2">
          {item.display_name}
        </Text>
        {isSelected && (
          <Text style={{ position: 'absolute', top: 6, right: 6 }}>
            <MaterialIcons name="check-circle" size={16} color={primary} />
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// TV Focusable Action Button Component
const TVFocusableActionButton = ({
  onPress,
  primary,
  hasBorder = true,
  label,
}: {
  onPress: () => void;
  primary: string;
  hasBorder?: boolean;
  label: string;
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
          borderLeftWidth.value = withTiming(4, { duration: 150 });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('transparent', { duration: 150 });
          borderLeftWidth.value = withTiming(0, { duration: 150 });
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
              borderBottomWidth: hasBorder ? 1 : 0,
              borderBottomColor: '#262626',
            },
          ]}>
          <Text style={{ color: 'white', fontSize: 16 }}>{label}</Text>
          <View
            style={{
              backgroundColor: '#262626',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}>
            <MaterialCommunityIcons
              name="delete-outline"
              size={20}
              color={primary}
            />
          </View>
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
      <TouchableOpacity
        className="bg-[#262626] px-4 py-2 rounded-lg"
        onPress={onPress}>
        <MaterialCommunityIcons
          name="delete-outline"
          size={20}
          color={primary}
        />
      </TouchableOpacity>
    </View>
  );
};

// TV Focusable Switch Item Component
const TVFocusableSwitchItem = ({
  icon,
  label,
  value,
  onValueChange,
  primary,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: () => void;
  primary: string;
  subtitle?: string;
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
          borderLeftWidth.value = withTiming(4, { duration: 150 });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('transparent', { duration: 150 });
          borderLeftWidth.value = withTiming(0, { duration: 150 });
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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {icon}
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: 'white', fontSize: 16 }}>{label}</Text>
              {subtitle && (
                <Text style={{ color: 'gray', fontSize: 12 }}>{subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: primary }}
            thumbColor={value ? '#f4f3f4' : '#f4f3f4'}
            value={value}
            onValueChange={onValueChange}
            focusable={false} // Switch itself shouldn't be focused on TV, the row is
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View className="bg-[#1A1A1A] overflow-hidden">
      <TouchableOpacity
        className="flex-row items-center justify-between p-4 border-b border-[#262626]"
        onPress={onValueChange}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {icon}
          <View style={{ marginLeft: 12 }}>
            <Text className="text-white text-base">{label}</Text>
            {subtitle && (
              <Text className="text-gray-400 text-xs">{subtitle}</Text>
            )}
          </View>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: primary }}
          thumbColor={value ? '#f4f3f4' : '#f4f3f4'}
          value={value}
          onValueChange={onValueChange}
        />
      </TouchableOpacity>
    </View>
  );
};


type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

const Settings = ({ navigation }: Props) => {
  const tabNavigation =
    useNavigation<NativeStackNavigationProp<TabStackParamList>>();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { primary } = useThemeStore(state => state);
  const { provider, setProvider, installedProviders } = useContentStore(
    state => state,
  );
  const { clearHistory } = useWatchHistoryStore(state => state);
  const { appMode, setAppMode } = useAppModeStore(state => state);

  const [watchTogetherMode, setWatchTogetherMode] = useState(
    getWatchTogetherMode(),
  );
  const [networkProxyMode, setNetworkProxyMode] = useState(
    getNetworkProxyMode(),
  );
  const [syncLink, setSyncLink] = useState('');
  const [pingStatus, setPingStatus] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const checkAllProviders = async () => {
      const results: Record<string, number | null> = {};

      const checkProvider = async (p: ProviderExtension) => {
        if (!p.sourceUrl) {
          results[p.value] = null;
          return;
        }

        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

          await fetch(p.sourceUrl, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache'
          });
          clearTimeout(timeoutId);
          const end = Date.now();
          results[p.value] = end - start;
        } catch (e) {
          results[p.value] = -1; // Error/Timeout
        }
      };

      await Promise.all(installedProviders.map(checkProvider));
      setPingStatus(results);
    };

    if (installedProviders.length > 0) {
      checkAllProviders();
    }
  }, [installedProviders]);

  const getLatencyColor = (latency: number | null | undefined) => {
    if (latency === undefined || latency === null) return 'gray';
    if (latency === -1) return '#EF4444'; // Red (Error)
    if (latency < 300) return '#22C55E'; // Green (Good)
    if (latency < 800) return '#EAB308'; // Yellow (Okay)
    return '#EF4444'; // Red (Slow)
  };

  const toggleWatchTogether = useCallback(() => {
    const newState = !watchTogetherMode;
    setWatchTogetherMode(newState);
    setWatchTogetherModeStorage(newState);

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('virtualKey', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  }, [watchTogetherMode]);

  const toggleNetworkProxy = useCallback(() => {
    const newState = !networkProxyMode;
    setNetworkProxyMode(newState);
    setNetworkProxyModeStorage(newState);

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    ToastAndroid.show(
      newState ? 'Secure Proxy Enabled' : 'Secure Proxy Disabled',
      ToastAndroid.SHORT,
    );
  }, [networkProxyMode]);

  const parseSyncLink = (link: string) => {
    const getParam = (key: string) => {
      const regex = new RegExp(`${key}=([^&\\n]+)`, 'i');
      const match = link.match(regex);
      return match ? match[1] : null;
    };

    const videoId = getParam('video_id');
    const time = getParam('time');
    const roomId = getParam('roomId');
    const leader = getParam('leader');
    const infoUrl = getParam('infoUrl');
    const providerValue = getParam('providerValue');
    const primaryTitle = getParam('primaryTitle');

    if (videoId && time !== null) {
      return {
        videoId,
        time: parseInt(time, 10),
        roomId,
        leader,
        infoUrl,
        providerValue,
        primaryTitle: primaryTitle
          ? decodeURIComponent(primaryTitle)
          : 'Shared Content',
      };
    }
    return null;
  };

  const handleJoinSession = useCallback(() => {
    const linkToJoin = syncLink.trim();
    if (!linkToJoin) {
      ToastAndroid.show(
        'Please paste a sync link to join.',
        ToastAndroid.SHORT,
      );
      return;
    }

    const parsedData = parseSyncLink(linkToJoin);

    if (parsedData) {
      const mockPlayerParams = {
        id: parsedData.videoId,
        primaryTitle: parsedData.primaryTitle,
        title: parsedData.primaryTitle,
        link: parsedData.videoId,
        poster: { logo: 'mock_poster_url' },
        linkIndex: 0,
        episodeList: [
          { link: parsedData.videoId, title: parsedData.primaryTitle },
        ],
        providerValue: parsedData.providerValue || provider.value,
        infoUrl: parsedData.infoUrl,
        provider: {
          value: parsedData.providerValue || provider.value,
          type: provider.type,
          display_name: provider.display_name,
          icon: provider.icon,
        } as ProviderExtension,
        type: 'Movie',
        syncLink: true,
        roomId: parsedData.roomId,
        leader: parsedData.leader,
        time: parsedData.time,
      };

      try {
        rootNavigation.navigate('Player' as any, mockPlayerParams as any);
        setSyncLink('');
        ToastAndroid.show(
          `Joining session at ${parsedData.time}s`,
          ToastAndroid.LONG,
        );
      } catch (error) {
        console.error('Navigation Crash Error:', error);
        ToastAndroid.show('Failed to join session.', ToastAndroid.LONG);
      }
    } else {
      ToastAndroid.show('Invalid sync link format.', ToastAndroid.LONG);
    }
  }, [syncLink, rootNavigation, provider]);

  const handlePasteLink = useCallback(async () => {
    try {
      const text = await Clipboard.getString();
      if (text && text.includes('video_id=') && text.includes('time=')) {
        setSyncLink(text);
        ToastAndroid.show(
          `Pasted link: ${text.substring(0, 30)}...`,
          ToastAndroid.SHORT,
        );
      } else {
        ToastAndroid.show('No valid sync link found.', ToastAndroid.SHORT);
      }
    } catch (error) {
      ToastAndroid.show('Failed to read from clipboard.', ToastAndroid.SHORT);
    }
  }, []);

  const handleProviderSelect = useCallback(
    (item: ProviderExtension) => {
      setProvider(item);
      // Add haptic feedback
      if (settingsStorage.isHapticFeedbackEnabled()) {
        ReactNativeHapticFeedback.trigger('virtualKey', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }
      // Navigate to home screen
      tabNavigation.navigate('HomeStack');
    },
    [setProvider, tabNavigation],
  );

  const renderProviderItem = useCallback(
    (item: ProviderExtension, isSelected: boolean, index: number) => (
      <TVFocusableProviderItem
        key={item.value}
        item={item}
        isSelected={isSelected}
        onPress={() => handleProviderSelect(item)}
        primary={primary}
        index={index}
      />
    ),
    [handleProviderSelect, primary],
  );

  const providersList = useMemo(
    () =>
      installedProviders.map((item, index) =>
        renderProviderItem(item, provider.value === item.value, index),
      ),
    [installedProviders, provider.value, renderProviderItem],
  );

  const clearCacheHandler = useCallback(() => {
    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('virtualKey', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    cacheStorageService.clearAll();
    // Also clear extension cache to force manifest refresh
    extensionStorage.clearAll();
    ToastAndroid.show('Cache Cleared', ToastAndroid.SHORT);
  }, []);

  const clearHistoryHandler = useCallback(() => {
    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('virtualKey', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    clearHistory();
    ToastAndroid.show('History Cleared', ToastAndroid.SHORT);
  }, [clearHistory]);

  const AnimatedSection = ({
    delay,
    children,
  }: {
    delay: number;
    children: React.ReactNode;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      layout={Layout.springify()}>
      {children}
    </Animated.View>
  );

  return (
    <Animated.ScrollView
      className="w-full h-full bg-black"
      showsVerticalScrollIndicator={false}
      bounces={true}
      overScrollMode="always"
      entering={FadeInUp.springify()}
      layout={Layout.springify()}
      contentContainerStyle={{
        paddingTop: 15,
        paddingBottom: 24,
        flexGrow: 1,
      }}>
      <View className="p-5">
        <Animated.View entering={FadeInUp.springify()}>
          <Text className="text-2xl font-bold text-white mb-6">Settings</Text>
        </Animated.View>

        {/* Content provider section */}
        <AnimatedSection delay={isTV ? 0 : 100}>
          <View className="mb-6 flex-col gap-3">
            <Text className="text-gray-400 text-sm mb-1">Content Provider</Text>
            <View
              className="bg-[#1A1A1A] rounded-xl py-4"
              style={isTV ? { paddingVertical: 20 } : undefined}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: isTV ? 16 : 10,
                }}>
                {providersList}
                {installedProviders.length === 0 && (
                  <Text className="text-gray-500 text-sm">
                    No providers installed
                  </Text>
                )}
              </ScrollView>
            </View>
            {/* Extensions */}
            <View className="bg-[#1A1A1A] rounded-xl overflow-hidden mb-3">
              <TVFocusableMenuItem
                onPress={() => navigation.navigate('Extensions')}
                icon={
                  <MaterialCommunityIcons
                    name="puzzle"
                    size={22}
                    color={primary}
                  />
                }
                label="Provider Manager"
                hasBorder={false}
              />
            </View>
          </View>
        </AnimatedSection>

        {/* --- NEW NETWORK / PROXY SECTION --- */}
        <AnimatedSection delay={isTV ? 0 : 120}>
          <View className="mb-6 flex-col gap-3">
            <Text className="text-gray-400 text-sm mb-1">
              Network & Connection
            </Text>
            <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              <TVFocusableSwitchItem
                icon={<MaterialCommunityIcons name="shield-check-outline" size={22} color={primary} />}
                label="Secure Proxy (VPN Mode)"
                subtitle="Bypass ISP blocks (Jio, etc) via DoH."
                value={networkProxyMode}
                onValueChange={toggleNetworkProxy}
                primary={primary}
              />
            </View>
          </View>
        </AnimatedSection>
        {/* ----------------------------------- */}

        {/* App Mode */}
        <AnimatedSection delay={isTV ? 0 : 50}>
          <View className="mb-6 flex-col gap-3">
            <Text className="text-gray-400 text-sm mb-1">App Mode</Text>
            <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              <TVFocusableSwitchItem
                icon={<MaterialCommunityIcons name="television-play" size={22} color={primary} />}
                label="Doodle-TV Mode"
                value={appMode === 'doodleTv'}
                onValueChange={() => {
                  setAppMode('doodleTv');
                  if (settingsStorage.isHapticFeedbackEnabled()) {
                    ReactNativeHapticFeedback.trigger('impactLight', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });
                  }
                }}
                primary={primary}
              />
            </View>
          </View>
        </AnimatedSection>

        {/* Watch Together Section */}
        <AnimatedSection delay={isTV ? 0 : 200}>
          <View className="mb-6 flex-col gap-3">
            <Text className="text-gray-400 text-sm mb-1">Watch Together</Text>
            <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              <TVFocusableSwitchItem
                icon={<MaterialIcons name="group" size={22} color={primary} />}
                label="Enable Watch Together Mode"
                value={watchTogetherMode}
                onValueChange={toggleWatchTogether}
                primary={primary}
              />

              {watchTogetherMode && (
                <View className="flex-col p-4">
                  <Text className="text-gray-400 text-sm mb-2">
                    Paste Sync Link to Join
                  </Text>
                  <View className="flex-row items-center">
                    <TextInput
                      className="flex-1 bg-white/10 text-white rounded-l-md p-2 h-10"
                      placeholder="e.g., doodlemovies://watch/..."
                      placeholderTextColor="#9CA3AF"
                      value={syncLink}
                      onChangeText={setSyncLink}
                    />
                    <TouchableOpacity
                      className="bg-gray-500 p-2 h-10 justify-center items-center"
                      onPress={handlePasteLink}>
                      <MaterialIcons
                        name="content-paste"
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-blue-600 rounded-r-md p-2 h-10 justify-center items-center"
                      onPress={handleJoinSession}>
                      <Text className="text-white font-semibold">Join</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-500 text-xs mt-2">
                    Enabling this mode allows you to create and join
                    synchronized playback sessions.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </AnimatedSection>

        {/* Main options section */}
        <AnimatedSection delay={isTV ? 0 : 200}>
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-3">Options</Text>
            <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              {/* Downloads */}
              <TVFocusableMenuItem
                onPress={() => navigation.navigate('Downloads')}
                icon={
                  <MaterialCommunityIcons
                    name="folder-download"
                    size={22}
                    color={primary}
                  />
                }
                label="Downloads"
                isFirst={true}
              />

              {/* Subtitle Style */}
              <TVFocusableMenuItem
                onPress={() => navigation.navigate('SubTitlesPreferences')}
                icon={
                  <MaterialCommunityIcons
                    name="subtitles"
                    size={22}
                    color={primary}
                  />
                }
                label="Subtitle Style"
              />

              {/* Watch History */}
              <TVFocusableMenuItem
                onPress={() => navigation.navigate('WatchHistoryStack')}
                icon={
                  <MaterialCommunityIcons
                    name="history"
                    size={22}
                    color={primary}
                  />
                }
                label="Watch History"
              />

              {/* Preferences */}
              <TVFocusableMenuItem
                onPress={() => navigation.navigate('Preferences')}
                icon={
                  <MaterialIcons
                    name="room-preferences"
                    size={22}
                    color={primary}
                  />
                }
                label="Preferences"
                hasBorder={false}
              />
            </View>
          </View>
        </AnimatedSection>

        {/* Data Management section */}
        <AnimatedSection delay={isTV ? 0 : 300}>
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-3">Data Management</Text>
            <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              {/* Clear Cache */}
              <TVFocusableActionButton
                onPress={clearCacheHandler}
                primary={primary}
                label="Clear Cache"
              />

              {/* Clear Watch History */}
              <TVFocusableActionButton
                onPress={clearHistoryHandler}
                primary={primary}
                label="Clear Watch History"
                hasBorder={false}
              />
            </View>
          </View>
        </AnimatedSection>

        {/* About & GitHub section */}
        <AnimatedSection delay={isTV ? 0 : 400}>
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-3">About</Text>
            <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              {/* About */}
              <TVFocusableMenuItem
                onPress={() => navigation.navigate('About')}
                icon={<Feather name="info" size={22} color={primary} />}
                label="About"
              />

              {/* Our Productions */}
              <TVFocusableMenuItem
                onPress={() => navigation.navigate('Production')}
                icon={<Feather name="smartphone" size={22} color={primary} />}
                label="Check Our Softwares"
              />

              {/* GitHub */}
              <TVFocusableMenuItem
                onPress={() => Linking.openURL(socialLinks.github)}
                icon={<AntDesign name="github" size={22} color={primary} />}
                label="Give a star ⭐"
                rightIcon="external-link"
              />

              {/* Sponsor */}
              <TVFocusableMenuItem
                onPress={() => Linking.openURL(socialLinks.sponsor)}
                icon={<AntDesign name="heart" size={22} color="#ff69b4" />}
                label="Sponsor Project"
                rightIcon="external-link"
                hasBorder={false}
              />

              {/* Developer */}
              <TVFocusableMenuItem
                onPress={() => Linking.openURL("https://instagram.com/appuz.404/")}
                icon={<AntDesign name="heart" size={22} color="#ff69b4" />}
                label="About the Developer"
                rightIcon="external-link"
                hasBorder={false}
              />
            </View>
          </View>
        </AnimatedSection>
      </View>
    </Animated.ScrollView>
  );
};

export default Settings;
