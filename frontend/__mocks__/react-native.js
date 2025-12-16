// Mock React Native for Jest testing
const React = require('react');

const View = ({ children, ...props }) => React.createElement('div', props, children);
const Text = ({ children, ...props }) => React.createElement('span', props, children);
const TouchableOpacity = ({ children, onPress, ...props }) => 
  React.createElement('button', { ...props, onClick: onPress }, children);
const TextInput = (props) => React.createElement('input', props);
const ScrollView = ({ children, ...props }) => React.createElement('div', props, children);
const FlatList = ({ data, renderItem, keyExtractor, ...props }) => 
  React.createElement('div', props, data?.map((item, index) => renderItem({ item, index })));
const Image = (props) => React.createElement('img', props);
const ActivityIndicator = () => React.createElement('div', { 'data-testid': 'loading' });
const Modal = ({ children, visible, ...props }) => 
  visible ? React.createElement('div', props, children) : null;
const Switch = (props) => React.createElement('input', { type: 'checkbox', ...props });
const Pressable = ({ children, onPress, ...props }) => 
  React.createElement('button', { ...props, onClick: onPress }, children);

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  hairlineWidth: 1,
};

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
  Version: 14,
};

const Dimensions = {
  get: () => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  createAnimatedComponent: (component) => component,
  timing: () => ({ start: jest.fn() }),
  spring: () => ({ start: jest.fn() }),
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => 0),
  })),
  event: jest.fn(),
  add: jest.fn(),
  multiply: jest.fn(),
  sequence: jest.fn(() => ({ start: jest.fn() })),
  parallel: jest.fn(() => ({ start: jest.fn() })),
};

const Alert = {
  alert: jest.fn(),
};

const Linking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const Keyboard = {
  dismiss: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
};

const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

const NativeModules = {};

const useColorScheme = () => 'light';
const useWindowDimensions = () => ({ width: 375, height: 812 });

module.exports = {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  Switch,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Alert,
  Linking,
  Keyboard,
  AppState,
  NativeModules,
  useColorScheme,
  useWindowDimensions,
};
