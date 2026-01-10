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
const downloadUpdate = async (url: string, name: string) => {
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
  setUpdateLoading: React.Dispatch<React.SetStateAction<boolean>>,
  autoDownload: boolean,
  showToast: boolean = true,
) => {
  setUpdateLoading(true);
  try {
    const res = await fetch(
      'https://api.github.com/repos/Zenda-Cross/doodle-movies-app/releases/latest',
    );
    const data = await res.json();
    const localVersion = Application.nativeApplicationVersion;
    const remoteVersion = Number(
      data.tag_name.replace('v', '')?.split('.').join(''),
    );
    if (compareVersions(localVersion || '', data.tag_name.replace('v', ''))) {
      ToastAndroid.show('New update available', ToastAndroid.SHORT);
      Alert.alert(`Update v${localVersion} -> ${data.tag_name}`, data.body, [
        { text: 'Cancel' },
        {
          text: 'Update',
          onPress: () =>
            autoDownload
              ? downloadUpdate(
                data?.assets?.[2]?.browser_download_url,
                data.assets?.[2]?.name,
              )
              : Linking.openURL(data.html_url),
        },
      ]);
      console.log(
        'local version',
        localVersion,
        'remote version',
        remoteVersion,
      );
    } else {
      showToast && ToastAndroid.show('App is up to date', ToastAndroid.SHORT);
      console.log(
        'local version',
        localVersion,
        'remote version',
        remoteVersion,
      );
    }
  } catch (error) {
    ToastAndroid.show('Failed to check for update', ToastAndroid.SHORT);
    console.log('Update error', error);
  }
  setUpdateLoading(false);
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
          onPress={() => checkForUpdate(setUpdateLoading, autoDownload, true)}
          disabled={updateLoading}
          icon={
            <MaterialCommunityIcons name="update" size={22} color="white" />
          }
          label="Check for Updates"
          primary={primary}
        />
      </View>
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
