import React, {useRef, useCallback} from 'react';
import {
  TouchableOpacity,
  Pressable,
  View,
  ViewStyle,
  StyleSheet,
  findNodeHandle,
  TVFocusGuideView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  isTV,
  TV_FOCUS_SCALE,
  TV_FOCUS_BORDER_WIDTH,
  TV_FOCUS_ANIMATION_DURATION,
} from '../../lib/tv/constants';

interface TVFocusableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: ViewStyle;
  focusedStyle?: ViewStyle;
  disabled?: boolean;
  hasTVPreferredFocus?: boolean;
  nextFocusUp?: number | null;
  nextFocusDown?: number | null;
  nextFocusLeft?: number | null;
  nextFocusRight?: number | null;
  focusScale?: number;
  focusBorderColor?: string;
  showFocusBorder?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * TVFocusable - A wrapper component that handles TV remote focus
 * Works with both Android TV and tvOS
 */
const TVFocusable: React.FC<TVFocusableProps> = ({
  children,
  onPress,
  onLongPress,
  onFocus,
  onBlur,
  style,
  focusedStyle,
  disabled = false,
  hasTVPreferredFocus = false,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  focusScale = TV_FOCUS_SCALE,
  focusBorderColor = '#E50914',
  showFocusBorder = true,
  testID,
  accessibilityLabel,
}) => {
  const buttonRef = useRef<View>(null);
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  const handleFocus = useCallback(() => {
    scale.value = withTiming(focusScale, {
      duration: TV_FOCUS_ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    borderOpacity.value = withTiming(1, {
      duration: TV_FOCUS_ANIMATION_DURATION,
    });
    onFocus?.();
  }, [focusScale, onFocus, scale, borderOpacity]);

  const handleBlur = useCallback(() => {
    scale.value = withTiming(1, {
      duration: TV_FOCUS_ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    borderOpacity.value = withTiming(0, {
      duration: TV_FOCUS_ANIMATION_DURATION,
    });
    onBlur?.();
  }, [onBlur, scale, borderOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
    };
  });

  const borderAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: showFocusBorder ? borderOpacity.value : 0,
    };
  });

  // For non-TV platforms, render a simple TouchableOpacity
  if (!isTV) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={style}
        activeOpacity={0.7}
        testID={testID}
        accessibilityLabel={accessibilityLabel}>
        {children}
      </TouchableOpacity>
    );
  }

  // TV-specific rendering with focus handling
  return (
    <Pressable
      ref={buttonRef}
      onPress={onPress}
      onLongPress={onLongPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      hasTVPreferredFocus={hasTVPreferredFocus}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      isTVSelectable={!disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={({focused: _focused}) => [style, _focused && focusedStyle]}>
      {({focused: _}) => (
        <Animated.View style={[animatedStyle]}>
          {children}
          {showFocusBorder && (
            <Animated.View
              style={[
                styles.focusBorder,
                {borderColor: focusBorderColor},
                borderAnimatedStyle,
              ]}
              pointerEvents="none"
            />
          )}
        </Animated.View>
      )}
    </Pressable>
  );
};

/**
 * TVFocusableCard - A card-style focusable component for content grids
 */
interface TVFocusableCardProps extends TVFocusableProps {
  width?: number;
  height?: number;
  borderRadius?: number;
}

export const TVFocusableCard: React.FC<TVFocusableCardProps> = ({
  children,
  width = 180,
  height = 270,
  borderRadius = 8,
  style,
  ...props
}) => {
  const cardStyle: ViewStyle = {
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    ...(style as object),
  };

  return (
    <TVFocusable style={cardStyle} {...props}>
      <View style={{width, height, borderRadius, overflow: 'hidden'}}>
        {children}
      </View>
    </TVFocusable>
  );
};

/**
 * TVFocusableButton - A button-style focusable component
 */
interface TVFocusableButtonProps extends TVFocusableProps {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const TVFocusableButton: React.FC<TVFocusableButtonProps> = ({
  children,
  variant = 'primary',
  style,
  focusBorderColor,
  ...props
}) => {
  const buttonStyles = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    outline: styles.outlineButton,
  };

  const combinedStyle: ViewStyle = {
    ...buttonStyles[variant],
    ...(style as object),
  };

  return (
    <TVFocusable
      style={combinedStyle}
      focusBorderColor={focusBorderColor || '#ffffff'}
      focusScale={1.05}
      {...props}>
      {children}
    </TVFocusable>
  );
};

/**
 * TVFocusGuide - Wrapper for TVFocusGuideView to control focus navigation
 */
interface TVFocusGuideProps {
  children: React.ReactNode;
  destinations?: React.RefObject<any>[];
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const TVFocusGuide: React.FC<TVFocusGuideProps> = ({
  children,
  destinations = [],
  autoFocus = false,
  style,
}) => {
  if (!isTV) {
    return <View style={style}>{children}</View>;
  }

  return (
    <TVFocusGuideView
      style={style}
      destinations={destinations.map(ref => findNodeHandle(ref.current))}
      autoFocus={autoFocus}>
      {children}
    </TVFocusGuideView>
  );
};

const styles = StyleSheet.create({
  focusBorder: {
    position: 'absolute',
    top: -TV_FOCUS_BORDER_WIDTH,
    left: -TV_FOCUS_BORDER_WIDTH,
    right: -TV_FOCUS_BORDER_WIDTH,
    bottom: -TV_FOCUS_BORDER_WIDTH,
    borderWidth: TV_FOCUS_BORDER_WIDTH,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(109, 109, 110, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TVFocusable;
