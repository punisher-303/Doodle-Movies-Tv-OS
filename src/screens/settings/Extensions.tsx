import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../App';
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  AntDesign,
} from '@expo/vector-icons';
import useThemeStore from '../../lib/zustand/themeStore';
import useContentStore from '../../lib/zustand/contentStore';
import {
  extensionStorage,
  ProviderExtension,
} from '../../lib/storage/extensionStorage';
import { extensionManager } from '../../lib/services/ExtensionManager';
import {
  updateProvidersService,
  UpdateInfo,
} from '../../lib/services/UpdateProviders';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { settingsStorage } from '../../lib/storage';
import RenderProviderFlagIcon from '../../components/RenderProviderFLagIcon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const isTV = Platform.isTV;

type Props = NativeStackScreenProps<SettingsStackParamList, 'Extensions'>;

type TabType = 'installed' | 'available';

const Extensions = ({ navigation }: Props) => {
  const { primary } = useThemeStore(state => state);
  const {
    provider: activeExtensionProvider,
    setProvider: setActiveExtensionProvider,
    installedProviders,
    availableProviders,
    setInstalledProviders,
    setAvailableProviders,
  } = useContentStore(state => state);
  const [activeTab, setActiveTab] = useState<TabType>(
    installedProviders?.length > 0 ? 'installed' : 'available',
  );
  const [installingProvider, setInstallingProvider] = useState<string | null>(
    null,
  );
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);
  const [updateInfos, setUpdateInfos] = useState<UpdateInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'global' | 'local'>('all');
  // Load providers on component mount
  useEffect(() => {
    const initializeExtensions = async () => {
      try {
        await extensionManager.initialize();
        loadProviders();
        await checkForUpdates();

        // Try to fetch latest providers if we don't have any
        if (!availableProviders || availableProviders.length === 0) {
          await handleRefresh();
        }
      } catch (error) {
        // Still try to load from cache if initialization fails
        loadProviders();
      }
    };

    initializeExtensions();
  }, []);
  const loadProviders = () => {
    const installed = extensionStorage.getInstalledProviders() || [];
    const available = extensionStorage.getAvailableProviders() || [];
    setInstalledProviders(installed);
    setAvailableProviders(available.filter(item => item && !item.disabled));
  };
  const checkForUpdates = async () => {
    try {
      const updates = await updateProvidersService.checkForUpdatesManual();
      setUpdateInfos(updates);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleUpdateProvider = async (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    setUpdatingProvider(provider.value);
    try {
      const success = await updateProvidersService.updateProvider(provider);
      if (success) {
        loadProviders();
        await checkForUpdates();

        Alert.alert(
          'Success',
          `${provider.display_name} has been updated successfully!`,
        );

        // Update the active provider if it was the one being updated
        if (activeExtensionProvider?.value === provider.value) {
          setActiveExtensionProvider(provider);
        }
      } else {
        Alert.alert('Error', 'Failed to update provider. Please try again.');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update provider. Please try again.');
    } finally {
      setUpdatingProvider(null);
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectTick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    setActiveTab(tab);
  };
  const handleInstallProvider = async (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    setInstallingProvider(provider.value);
    try {
      await extensionManager.installProvider(provider);
      loadProviders();

      Alert.alert(
        'Success',
        `${provider.display_name} has been installed successfully!`,
      );
      setInstalledProviders(extensionStorage.getInstalledProviders() || []);
      if (
        !activeExtensionProvider ||
        activeExtensionProvider.value !== provider.value
      ) {
        setActiveExtensionProvider(provider);
      }
    } catch (error) {
      console.error('Installation error:', error);
      Alert.alert('Error', 'Failed to install provider. Please try again.');
    } finally {
      setInstallingProvider(null);
    }
  };
  const handleUninstallProvider = (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    Alert.alert(
      'Uninstall Provider',
      `Are you sure you want to uninstall ${provider.display_name || 'this provider'
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: () => {
            extensionStorage.uninstallProvider(provider.value);
            loadProviders();
            setInstalledProviders(
              extensionStorage.getInstalledProviders() || [],
            );

            // If this was the active provider, clear it
            if (activeExtensionProvider?.value === provider?.value) {
              setActiveExtensionProvider(
                extensionStorage.getInstalledProviders()[0] || {
                  value: '',
                  display_name: '',
                  type: '',
                  version: '',
                },
              );
            }
          },
        },
      ],
    );
  };
  const handleSetActiveProvider = (provider: ProviderExtension) => {
    if (!provider || !provider.value) {
      Alert.alert('Error', 'Invalid provider data');
      return;
    }

    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    setActiveExtensionProvider(provider);
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const providers = await extensionManager.fetchManifest(true);

      // Update available providers in storage and state
      extensionStorage.setAvailableProviders(providers);
      setAvailableProviders(providers);

      loadProviders();
      await checkForUpdates();
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert(
        'Error',
        'Failed to refresh providers list. Please check your internet connection.',
      );
    } finally {
      setRefreshing(false);
    }
  };

  // --- BULK ACTION FUNCTIONS ---
  const handleEnableAllProviders = async () => {
    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    const availableToInstall = (availableProviders || []).filter(
      provider =>
        provider &&
        provider.value &&
        !extensionStorage.isProviderInstalled(provider.value),
    );

    if (availableToInstall.length === 0) {
      Alert.alert('Info', 'All available providers are already installed.');
      return;
    }

    Alert.alert(
      'Enable All',
      `Are you sure you want to install ${availableToInstall.length} providers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Install All',
          style: 'default',
          onPress: async () => {
            setIsPerformingBulkAction(true);
            try {
              // Use Promise.all to install all providers in parallel
              await Promise.all(
                availableToInstall.map(provider =>
                  extensionManager.installProvider(provider),
                ),
              );
              loadProviders();
              Alert.alert(
                'Success',
                'All available providers have been installed!',
              );
              setActiveTab('installed');
            } catch (error) {
              console.error('Bulk installation error:', error);
              Alert.alert(
                'Error',
                'Failed to install all providers. Please try again.',
              );
            } finally {
              setIsPerformingBulkAction(false);
            }
          },
        },
      ],
    );
  };

  const handleDisableAllProviders = () => {
    if (settingsStorage.isHapticFeedbackEnabled()) {
      ReactNativeHapticFeedback.trigger('effectClick', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    if ((installedProviders || []).length === 0) {
      Alert.alert('Info', 'No providers are currently installed.');
      return;
    }

    Alert.alert(
      'Disable All',
      `Are you sure you want to uninstall all installed providers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall All',
          style: 'destructive',
          onPress: () => {
            // Create a new function to uninstall without alerts to prevent multiple dialogs
            const uninstallWithoutAlert = (provider: ProviderExtension) => {
              if (!provider || !provider.value) return;
              extensionStorage.uninstallProvider(provider.value);
            };
            installedProviders?.forEach(uninstallWithoutAlert);
            loadProviders();
            setActiveExtensionProvider(undefined);
            Alert.alert('Success', 'All providers have been uninstalled!');
          },
        },
      ],
    );
  };

  const renderProviderCard = ({
    item,
    index,
  }: {
    item: ProviderExtension;
    index: number;
  }) => {
    if (!item || !item.value) return null;
    const isActive = activeExtensionProvider?.value === item.value;
    const isInstalled = extensionStorage.isProviderInstalled(item.value);
    const isInstalling = installingProvider === item.value;
    const isUpdating = updatingProvider === item.value;
    const updateInfo = updateInfos.find(
      info => info.provider.value === item.value,
    );
    const hasUpdate = updateInfo?.hasUpdate || false;

    // TV focusable card wrapper
    const TVFocusableCard = ({ children }: { children: React.ReactNode }) => {
      const borderWidth = useSharedValue(0);

      const animatedStyle = useAnimatedStyle(() => ({
        borderWidth: borderWidth.value,
        borderColor: primary,
      }));

      if (isTV) {
        return (
          <Pressable
            onPress={() =>
              activeTab === 'installed'
                ? handleSetActiveProvider(item)
                : handleInstallProvider(item)
            }
            onFocus={() => {
              borderWidth.value = withTiming(3, { duration: 150 });
            }}
            onBlur={() => {
              borderWidth.value = withTiming(0, { duration: 150 });
            }}
            hasTVPreferredFocus={index === 0}
            isTVSelectable={true}
            style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Animated.View
              style={[
                animatedStyle,
                {
                  backgroundColor: '#262626',
                  borderRadius: 16,
                  padding: 20,
                  paddingVertical: 12,
                },
              ]}>
              {children}
            </Animated.View>
          </Pressable>
        );
      }

      return (
        <View
          className="bg-tertiary rounded-2xl p-5 py-3 mb-4 mx-4 shadow-lg border border-quaternary"
          style={{ elevation: 4 }}>
          {children}
        </View>
      );
    };

    return (
      <TVFocusableCard>
        <View className="flex-row items-center mb-4 gap-4 justify-between">
          {/* Left: Icon */}
          {item.icon ? (
            <Image
              source={{ uri: item.icon }}
              className="w-12 h-12 rounded-xl border-2 border-primary bg-quaternary"
              style={{ resizeMode: 'cover' }}
            />
          ) : (
            <View className="px-3 py-2 bg-quaternary rounded-xl border border-gray-700">
              <RenderProviderFlagIcon type={item.type} />
            </View>
          )}
          {/* Middle: Info */}
          <View className="flex-1 mx-3">
            <View className="flex-row items-center flex-wrap">
              <Text className="text-white text-lg font-bold tracking-wide">
                {item.display_name || 'Unknown Provider'}
              </Text>
              {hasUpdate && updateInfo && (
                <View
                  style={{ backgroundColor: primary }}
                  className="px-2 py-0.5 rounded-full ml-1">
                  <Text className="text-xs text-white font-semibold bg-gray-800">
                    Update
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-gray-400 text-sm ">
              Version{' '}
              <Text className="text-white font-medium">
                {item.version || 'Unknown'}
              </Text>{' '}
              • {item.type || 'Unknown'}
            </Text>
          </View>
          {/* Right: Buttons */}
          <View className="flex-row gap-3 items-center">
            {activeTab === 'installed' ? (
              <>
                <TouchableOpacity
                  onPress={() => handleSetActiveProvider(item)}
                  className={`w-9 h-9 rounded-full items-center justify-center ${isActive ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  style={{ opacity: isActive ? 1 : 0.9 }}>
                  <MaterialIcons
                    name={isActive ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                {hasUpdate && (
                  <TouchableOpacity
                    onPress={() => handleUpdateProvider(updateInfo!.provider)}
                    disabled={isUpdating}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: primary,
                      opacity: isUpdating ? 0.7 : 1,
                    }}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialCommunityIcons
                        name="update"
                        size={20}
                        color="white"
                      />
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleUninstallProvider(item)}
                  className="w-9 h-9 rounded-full items-center justify-center bg-red-600">
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => handleInstallProvider(item)}
                disabled={isInstalled || isInstalling}
                className={'w-9 h-9 rounded-full items-center justify-center'}
                style={{
                  opacity: isInstalling ? 0.7 : 1,
                  backgroundColor: isInstalled ? 'gray' : primary,
                }}>
                {isInstalling ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons
                    name={isInstalled ? 'check' : 'download'}
                    size={20}
                    color="white"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TVFocusableCard>
    );
  };
  const getFilteredData = () => {
    const baseData = activeTab === 'installed'
      ? (installedProviders || [])
      : (availableProviders || []);

    return baseData.filter(item => {
      if (!item || !item.value) return false;

      // Search Filter
      const matchesSearch = item.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Type Filter
      if (filterType !== 'all') {
        // Assuming item.type contains 'movie' or 'tv' or similar
        // We need to check actual type strings from provider. 
        // Common types: 'movie', 'series', 'anime', 'tv', etc.
        // If filter is 'movie', accept 'movie'. If 'tv', accept 'series', 'tv', 'anime'.
        if (filterType === 'movie' && !item.type?.toLowerCase().includes('movie')) return false;
        if (filterType === 'tv' && item.type?.toLowerCase().includes('movie')) return false; // Crude check
      }

      // Category Filter - Assuming metadata or flag
      // For now, let's just stick to Type and Search as Category might need specific manifest fields.
      // If 'Global' vs 'Local' refers to something specific in Android app, I should check.
      // Android 'Category' filter checks `item.isLocal`? 
      // I'll stick to Search and Type for now as they are most clear.

      return true;
    });
  };

  const currentData = getFilteredData();

  const FilterButton = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${isActive ? 'bg-primary' : 'bg-gray-800/50'}`}
      style={{ backgroundColor: isActive ? primary : '#1f2937' }}
    >
      <Text className={`font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black pt-10 pb-16">
      <StatusBar backgroundColor="black" barStyle="light-content" />
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <AntDesign name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Providers</Text>
        <View className="flex-row items-center space-x-2 gap-4">
          {isPerformingBulkAction ? (
            <ActivityIndicator size="small" color={primary} />
          ) : (
            <>
              {activeTab === 'available' && (
                <TouchableOpacity onPress={handleEnableAllProviders}>
                  <MaterialCommunityIcons
                    name="download-multiple"
                    size={24}
                    color={primary}
                  />
                </TouchableOpacity>
              )}
              {activeTab === 'installed' && (
                <TouchableOpacity onPress={handleDisableAllProviders}>
                  <MaterialCommunityIcons
                    name="delete-sweep"
                    size={24}
                    color="red"
                  />
                </TouchableOpacity>
              )}
            </>
          )}
          <TouchableOpacity onPress={handleRefresh}>
            <Feather name="refresh-cw" size={24} color={primary} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Tabs */}
      <View className="flex-row bg-quaternary mx-4 mt-4 rounded-xl">
        <TouchableOpacity
          onPress={() => handleTabChange('installed')}
          className="flex-1 py-3 rounded-xl"
          style={{
            backgroundColor:
              activeTab === 'installed' ? primary : 'transparent',
          }}>
          <Text
            className={`text-center font-medium ${activeTab === 'installed' ? 'text-white' : 'text-gray-400'
              }`}>
            Installed ({(installedProviders || []).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('available')}
          className="flex-1 py-3 rounded-xl"
          style={{
            backgroundColor:
              activeTab === 'available' ? primary : 'transparent',
          }}>
          <Text
            className={`text-center font-medium ${activeTab === 'available' ? 'text-white' : 'text-gray-400'
              }`}>
            Available ({(availableProviders || []).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View className="px-4 mt-4">
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-800/50 rounded-xl px-3 mb-4 border border-gray-700">
          <Feather name="search" size={20} color="gray" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search providers..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-white p-3 text-base"
            style={{ color: 'white' }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
          <FilterButton label="All" isActive={filterType === 'all'} onPress={() => setFilterType('all')} />
          <FilterButton label="Movies" isActive={filterType === 'movie'} onPress={() => setFilterType('movie')} />
          <FilterButton label="TV Series" isActive={filterType === 'tv'} onPress={() => setFilterType('tv')} />
        </ScrollView>
      </View>

      {/* Provider list */}
      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[primary]}
            tintColor={primary}
            progressBackgroundColor="black"
          />
        }>
        {currentData.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <MaterialCommunityIcons
              name="package-variant"
              size={64}
              color="gray"
            />
            <Text className="text-gray-400 text-lg mt-4">
              {activeTab === 'installed'
                ? 'No providers installed'
                : 'No providers available'}
            </Text>
            <Text className="text-gray-500 text-sm mt-2 text-center px-8">
              {activeTab === 'installed'
                ? 'Install providers from the Available tab to get started'
                : 'Pull to refresh to check for available providers'}
            </Text>
          </View>
        ) : (
          currentData.map((item, index) => (
            <View key={item?.value || `provider-${index}`}>
              {renderProviderCard({ item, index })}
            </View>
          ))
        )}
      </ScrollView>
    </View >
  );
};

export default Extensions;
