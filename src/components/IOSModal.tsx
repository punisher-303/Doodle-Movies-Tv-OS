import React from 'react';
import { View, Text, Modal, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import useThemeStore from '../lib/zustand/themeStore';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Action {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface IOSModalProps {
    visible: boolean;
    title: string; // The release tag e.g., v1.0.0
    message: string; // The dynamic body text
    actions: Action[];
    onClose: () => void;
}

const isTV = Platform.isTV;

const TVFocusableModalButton = ({
    action,
    primary,
    index,
    total,
}: {
    action: Action;
    primary: string;
    index: number;
    total: number;
}) => {
    const backgroundColor = useSharedValue('transparent');
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: backgroundColor.value,
        transform: [{ scale: scale.value }],
    }));

    if (isTV) {
        return (
            <Pressable
                onPress={action.onPress}
                onFocus={() => {
                    backgroundColor.value = withTiming('rgba(255,255,255,0.2)', { duration: 150 });
                    scale.value = withTiming(1.05, { duration: 150 });
                }}
                onBlur={() => {
                    backgroundColor.value = withTiming('transparent', { duration: 150 });
                    scale.value = withTiming(1, { duration: 150 });
                }}
                isTVSelectable={true}
                style={{ width: '100%' }}
            >
                <Animated.View
                    style={[
                        animatedStyle,
                        {
                            width: '100%',
                            paddingVertical: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTopWidth: index > 0 ? 1 : 0,
                            borderTopColor: 'rgba(255,255,255,0.1)',
                        }
                    ]}
                >
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: action.style === 'cancel' ? '600' : '400',
                            color: action.style === 'destructive' ? '#FF453A' : primary,
                        }}
                    >
                        {action.text}
                    </Text>
                </Animated.View>
            </Pressable>
        );
    }

    // Fallback for non-TV (unlikely in this codebase but good practice)
    return (
        <View style={{ width: '100%', paddingVertical: 16, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }}>
            <Text style={{ color: primary }}>{action.text}</Text>
        </View>
    );
};

const IOSModal: React.FC<IOSModalProps> = ({ visible, title, message, actions, onClose }) => {
    const { primary } = useThemeStore(state => state);

    // Filter actions
    const cancelAction = actions.find(a => a.style === 'cancel');
    const otherActions = actions.filter(a => a.style !== 'cancel');

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80 pb-0 px-4">
                <BlurView
                    intensity={90}
                    tint="systemMaterialDark"
                    className="w-full max-w-[500px] rounded-xl overflow-hidden bg-zinc-900/95 mb-4"
                    style={{ overflow: 'hidden' }}
                >
                    {/* Header */}
                    <View className="items-center py-6 px-6 border-b border-white/10">
                        <Text
                            className="text-xl font-bold text-center leading-6 mb-2"
                            style={{ color: primary }}
                        >
                            {title}
                        </Text>
                        {message ? (
                            <Text className="text-white/80 text-base mt-2 text-center leading-5">
                                {message}
                            </Text>
                        ) : null}
                    </View>

                    {/* Actions */}
                    {otherActions.map((action, index) => (
                        <TVFocusableModalButton
                            key={index}
                            action={action}
                            primary={primary}
                            index={index}
                            total={otherActions.length}
                        />
                    ))}
                </BlurView>

                {/* Cancel Action (Separate) */}
                {cancelAction && (
                    <BlurView
                        intensity={90}
                        tint="systemMaterialDark"
                        className="w-full max-w-[500px] rounded-xl overflow-hidden bg-zinc-800/95"
                    >
                        <TVFocusableModalButton
                            action={cancelAction}
                            primary={primary}
                            index={0}
                            total={1}
                        />
                    </BlurView>
                )}
            </View>
        </Modal>
    );
};

export default IOSModal;
