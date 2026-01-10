import {Platform, Dimensions} from 'react-native';

/**
 * Detect if the app is running on a TV device
 */
export const isTV = Platform.isTV;

/**
 * Detect if specifically running on Android TV
 */
export const isAndroidTV = Platform.OS === 'android' && Platform.isTV;

/**
 * Detect if specifically running on Apple TV (tvOS)
 */
export const isTVOS = Platform.OS === 'ios' && Platform.isTV;

/**
 * Get screen dimensions
 */
export const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
  Dimensions.get('window');

/**
 * TV-specific focus styling constants
 */
export const TV_FOCUS_SCALE = 1.08;
export const TV_FOCUS_BORDER_WIDTH = 3;
export const TV_FOCUS_ANIMATION_DURATION = 150;

/**
 * TV poster dimensions (larger for TV screens)
 */
export const TV_POSTER_WIDTH = isTV ? 180 : 100;
export const TV_POSTER_HEIGHT = isTV ? 270 : 150;

/**
 * TV card dimensions for horizontal lists
 */
export const TV_CARD_WIDTH = isTV ? 200 : 120;
export const TV_CARD_HEIGHT = isTV ? 300 : 180;
export const TV_CARD_MARGIN = isTV ? 16 : 8;

/**
 * TV hero height
 */
export const TV_HERO_HEIGHT = isTV ? '45vh' : '55vh';

/**
 * TV font sizes (larger for TV screens)
 */
export const TV_FONT_SIZES = {
  title: isTV ? 32 : 24,
  subtitle: isTV ? 20 : 16,
  body: isTV ? 18 : 14,
  small: isTV ? 16 : 12,
};

/**
 * TV spacing
 */
export const TV_SPACING = {
  xs: isTV ? 8 : 4,
  sm: isTV ? 12 : 8,
  md: isTV ? 20 : 12,
  lg: isTV ? 32 : 20,
  xl: isTV ? 48 : 32,
};

/**
 * TV navigation keys (for Android TV remote)
 */
export const TV_REMOTE_KEYS = {
  SELECT: 'select',
  PLAY_PAUSE: 'playPause',
  MENU: 'menu',
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
  BACK: 'back',
};
