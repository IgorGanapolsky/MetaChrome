import type Reactotron from 'reactotron-react-native';

declare global {
  interface Console {
    tron?: Reactotron;
  }
}

export {};
