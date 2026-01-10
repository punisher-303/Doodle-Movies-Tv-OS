import {
  View,
  Text,
  TouchableNativeFeedback,
  ToastAndroid,
  Linking,
  Alert,
  Switch,
  Platform,
  Pressable,
} from 'react-native';
// import pkg from '../../../package.json';
import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { settingsStorage } from '../../lib/storage';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useThemeStore from '../../lib/zustand/themeStore';
import * as Application from 'expo-application';
import { notificationService } from '../../lib/services/Notification';
import IOSModal from '../../components/IOSModal';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const isTV = Platform.isTV;

// TV Focusable Switch Row Component
const TVFocusableSwitchRow = ({
  label,
  description,
  value,
  onValueChange,
  primary,
  isFirst = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: () => void;
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
        onPress={onValueChange}
        onFocus={() => {
          backgroundColor.value = withTiming('rgba(255,255,255,0.1)', { duration: 150 });
          borderLeftWidth.value = withTiming(4, { duration: 150 });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('transparent', { duration: 150 });
          borderLeftWidth.value = withTiming(0, { duration: 150 });
        }}
        hasTVPreferredFocus={isFirst}
        isTVSelectable={true}
        style={{ marginBottom: 16 }}>
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 16,
              borderRadius: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          ]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: 'white', fontSize: 16 }}>{label}</Text>
            {description && (
              <Text style={{ color: 'gray', fontSize: 14, marginTop: 4 }}>
                {description}
              </Text>
            )}
          </View>
          <Switch
            value={value}
            onValueChange={onValueChange}
            thumbColor={value ? primary : 'gray'}
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View
      className={`bg-white/10 ${description ? 'p-3' : 'p-4'} rounded-lg flex-row justify-between items-center mb-4`}>
      <View className={description ? 'flex-1 mr-2' : undefined}>
        <Text className="text-white text-base">{label}</Text>
        {description && (
          <Text className="text-gray-400 text-sm">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? primary : 'gray'}
      />
    </View>
  );
};

// TV Focusable Button Component
const TVFocusableButton = ({
  onPress,
  icon,
  label,
  disabled,
  primary,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
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
          backgroundColor.value = withTiming('rgba(255,255,255,0.1)', { duration: 150 });
          borderLeftWidth.value = withTiming(4, { duration: 150 });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('transparent', { duration: 150 });
          borderLeftWidth.value = withTiming(0, { duration: 150 });
        }}
        isTVSelectable={!disabled}
        style={{ marginTop: 16, opacity: disabled ? 0.5 : 1 }}>
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 16,
              borderRadius: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          ]}>
            ]}
          pointerEvents="none"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon}
            <Text style={{ color: 'white', fontSize: 16, marginLeft: 12 }}>
              {label}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="white" />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableNativeFeedback
      onPress={onPress}
      disabled={disabled}
      background={TouchableNativeFeedback.Ripple('#ffffff20', false)}>
      <View className="bg-white/10 p-4 rounded-lg flex-row justify-between items-center mt-4">
        <View className="flex-row items-center space-x-3">
          {icon}
          <Text className="text-white text-base">{label}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="white" />
      </View>
    </TouchableNativeFeedback>
  );
};

// download update
export const downloadUpdate = async (url: string, name: string) => {
  console.log('downloading', url, name);
  await notificationService.requestPermission();

  try {
    if (await RNFS.exists(`${RNFS.DownloadDirectoryPath}/${name}`)) {
      await notificationService.displayUpdateNotification({
        id: 'downloadComplete',
        title: 'Download Completed',
        body: 'Tap to install',
        data: { name: `${name}`, action: 'install' },
      });
      return;
    }
  } catch (error) { }
  const { promise } = RNFS.downloadFile({
    fromUrl: url,
    background: true,
    progressInterval: 1000,
    progressDivider: 1,
    toFile: `${RNFS.DownloadDirectoryPath}/${name}`,
    begin: res => {
      console.log('begin', res.jobId, res.statusCode, res.headers);
    },
    progress: res => {
      console.log('progress', res.bytesWritten, res.contentLength);
      notificationService.showUpdateProgress(
        'Downloading Update',
        `Version ${Application.nativeApplicationVersion} -> ${name}`,
        {
          current: res.bytesWritten,
          max: res.contentLength,
          indeterminate: false,
        },
      );
    },
  });
  promise.then(async res => {
    if (res.statusCode === 200) {
      await notificationService.cancelNotification('updateProgress');
      await notificationService.displayUpdateNotification({
        id: 'downloadComplete',
        title: 'Download Complete',
        body: 'Tap to install',
        data: { name, action: 'install' },
      });
    }
  });
};

// handle check for update
export const checkForUpdate = async (
  setUpdateLoading?: React.Dispatch<React.SetStateAction<boolean>>,
  showToast: boolean = true,
): Promise<any | null> => {
  if (setUpdateLoading) setUpdateLoading(true);
  try {
    const res = await fetch(
      'https://api.github.com/repos/punisher-303/Doodle-Movies-Tv-OS/releases/latest',
    );
    const data = await res.json();

    // Fetch dynamic download URL
    let play_store_url = data.html_url;
    try {
      const urlRes = await fetch(
        'https://raw.githubusercontent.com/punisher-303/Doodle-Movies-Tv-OS/main/updateurl/update_url.json'
      );
      const urlData = await urlRes.json();
      if (urlData.play_store_url) {
        play_store_url = urlData.play_store_url;
      }
    } catch (e) {
      console.log('Failed to fetch dynamic url', e);
    }

    const localVersion = Application.nativeApplicationVersion;
    // const remoteVersion = Number(
    //   data.tag_name.replace('v', '')?.split('.').join(''),
    // );

    // Simple version compare or use helper
    if (compareVersions(localVersion || '', data.tag_name.replace('v', ''))) {
      if (showToast) ToastAndroid.show('New update available', ToastAndroid.SHORT);
      if (setUpdateLoading) setUpdateLoading(false);
      return { ...data, play_store_url };
    } else {
      showToast && ToastAndroid.show('App is up to date', ToastAndroid.SHORT);
    }
  } catch (error) {
    if (showToast) ToastAndroid.show('Failed to check for update', ToastAndroid.SHORT);
    console.log('Update error', error);
  }
  if (setUpdateLoading) setUpdateLoading(false);
  return null;
};

const About = () => {
  const { primary } = useThemeStore(state => state);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [autoDownload, setAutoDownload] = useState(
    settingsStorage.isAutoDownloadEnabled(),
  );
  const [autoCheckUpdate, setAutoCheckUpdate] = useState<boolean>(
    settingsStorage.isAutoCheckUpdateEnabled(),
  );

  const [updateData, setUpdateData] = useState<any>(null);

  const handleManualCheck = async () => {
    const data = await checkForUpdate(setUpdateLoading, true);
    if (data) {
      setUpdateData(data);
    }
  };

  const performUpdate = () => {
    if (!updateData) return;
    setUpdateData(null); // Close modal 

    // Find the correct asset or fallback
    // Usually index 2 in Android app, but verify logic. 
    // Fallback to html_url if autoDownload is missing or fails.
    if (autoDownload) {
      // Using simpler safe access logic or stick to user's "exact" index 2
      downloadUpdate(
        updateData?.assets?.[2]?.browser_download_url || updateData?.assets?.[0]?.browser_download_url,
        updateData.assets?.[2]?.name || updateData.assets?.[0]?.name,
      );
    } else {
      Linking.openURL(updateData.play_store_url || updateData.html_url);
    }
  };

  return (
    <View
      className="flex-1 bg-black mt-8"
      style={isTV ? { paddingHorizontal: 24, marginTop: 20 } : undefined}>
      <View className="px-4 py-3 border-b border-white/10">
        <Text
          style={{
            fontSize: isTV ? 28 : 24,
            fontWeight: 'bold',
            color: 'white',
          }}>
          About
        </Text>
        <Text className="text-gray-400 mt-1 text-sm">
          App information and updates
        </Text>
      </View>

      <View className="p-4 space-y-4 pb-24">
        {/* Version */}
        <View className="bg-white/10 p-4 rounded-lg flex-row justify-between items-center mb-4">
          <Text className="text-white text-base">Version</Text>
          <Text className="text-white/70">
            v{Application.nativeApplicationVersion}
          </Text>
        </View>

        {/* Auto Install Updates */}
        <TVFocusableSwitchRow
          label="Auto Install Updates"
          value={autoDownload}
          onValueChange={() => {
            setAutoDownload(!autoDownload);
            settingsStorage.setAutoDownloadEnabled(!autoDownload);
          }}
          primary={primary}
          isFirst={true}
        />

        {/* Auto Check Updates */}
        <TVFocusableSwitchRow
          label="Check Updates on Start"
          description="Automatically check for updates when app starts"
          value={autoCheckUpdate}
          onValueChange={() => {
            setAutoCheckUpdate(!autoCheckUpdate);
            settingsStorage.setAutoCheckUpdateEnabled(!autoCheckUpdate);
          }}
          primary={primary}
        />

        {/* Check Updates Button */}
        <TVFocusableButton
          onPress={handleManualCheck}
          disabled={updateLoading}
          icon={
            <MaterialCommunityIcons name="update" size={22} color="white" />
          }
          label="Check for Updates"
          primary={primary}
        />
      </View>

      {/* Update Modal */}
      <IOSModal
        visible={!!updateData}
        title={`Update Available: ${updateData?.tag_name}`}
        message={updateData?.body || 'A new version of the app is available.'}
        actions={[
          { text: "Update Now", onPress: performUpdate },
          { text: "Cancel", style: 'cancel', onPress: () => setUpdateData(null) }
        ]}
        onClose={() => setUpdateData(null)}
      />
    </View>
  );
};

export default About;

function compareVersions(localVersion: string, remoteVersion: string): boolean {
  try {
    // Split versions into arrays and convert to numbers
    const local = localVersion.split('.').map(Number);
    const remote = remoteVersion.split('.').map(Number);

    // Compare major version
    if (remote[0] > local[0]) {
      return true;
    }
    if (remote[0] < local[0]) {
      return false;
    }

    // Compare minor version
    if (remote[1] > local[1]) {
      return true;
    }
    if (remote[1] < local[1]) {
      return false;
    }

    // Compare patch version
    if (remote[2] > local[2]) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Invalid version format');
    return false;
  }
}
