// screens/Production.tsx
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { Feather } from '@expo/vector-icons'; // Import Feather icons
import useThemeStore from '../../lib/zustand/themeStore';
import { productionApps } from '../../lib/constants';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const isTV = Platform.isTV;

const TVFocusableProductionItem = ({
  onPress,
  icon,
  name,
  primary,
}: {
  onPress: () => void;
  icon: any;
  name: string;
  primary: string;
}) => {
  const backgroundColor = useSharedValue('#1A1A1A');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    transform: [{ scale: scale.value }],
  }));

  if (isTV) {
    return (
      <Pressable
        onPress={onPress}
        onFocus={() => {
          backgroundColor.value = withTiming('#333333', { duration: 150 });
          scale.value = withTiming(1.02, { duration: 150 });
        }}
        onBlur={() => {
          backgroundColor.value = withTiming('#1A1A1A', { duration: 150 });
          scale.value = withTiming(1, { duration: 150 });
        }}
        isTVSelectable={true}
        style={{ marginBottom: 12 }}>
        <Animated.View
          style={[animatedStyle, { borderRadius: 12, overflow: 'hidden' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name={icon} size={22} color={primary} />
              <Text style={{ color: 'white', marginLeft: 12, fontSize: 16 }}>
                {name}
              </Text>
            </View>
            <Feather name="external-link" size={20} color="gray" />
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-[#1A1A1A] rounded-xl overflow-hidden mb-3">
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center">
          <Feather name={icon} size={22} color={primary} />
          <Text className="text-white ml-3 text-base">
            {name}
          </Text>
        </View>
        <Feather name="external-link" size={20} color="gray" />
      </View>
    </TouchableOpacity>
  );
};

const Production = () => {
  const insets = useSafeAreaInsets();
  const { primary } = useThemeStore(state => state);

  const AnimatedSection = ({
    delay,
    children,
  }: {
    delay: number;
    children: React.ReactNode;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}>
      {children}
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3 border-b border-white/10">
        <Text className="text-2xl font-bold text-white">Our Productions</Text>
        <Text className="text-gray-400 mt-1 text-sm">
          Check out our other amazing apps
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="p-4">
          {/* Echo Pulse Music */}
          <AnimatedSection delay={100}>
            <TVFocusableProductionItem
              onPress={() => Linking.openURL(productionApps.app1.url)}
              icon={productionApps.app1.icon}
              name={productionApps.app1.name}
              primary={primary}
            />
          </AnimatedSection>

          {/* Doodle Windows */}
          <AnimatedSection delay={200}>
            <TVFocusableProductionItem
              onPress={() => Linking.openURL(productionApps.app2.url)}
              icon={productionApps.app2.icon}
              name={productionApps.app2.name}
              primary={primary}
            />
          </AnimatedSection>

          {/* Doodle Web Play */}
          <AnimatedSection delay={300}>
            <TVFocusableProductionItem
              onPress={() => Linking.openURL(productionApps.app3.url)}
              icon={productionApps.app3.icon}
              name={productionApps.app3.name}
              primary={primary}
            />
          </AnimatedSection>

          {/* Description */}
          <AnimatedSection delay={400}>
            <View className="bg-[#1A1A1A] rounded-xl p-4">
              <Text className="text-white text-base font-semibold mb-2">
                About Our Apps
              </Text>
              <Text className="text-gray-400 text-sm">
                We create high-quality mobile applications with great user experiences.
                Each app is designed to make your daily tasks easier and more enjoyable.
              </Text>
            </View>
          </AnimatedSection>
        </View>
      </ScrollView>
    </View>
  );
};

export default Production;
