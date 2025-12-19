import AsyncStorage from '@react-native-async-storage/async-storage';
import Reactotron from 'reactotron-react-native';
import { Platform } from 'react-native';

const host = Platform.select({
  ios: 'localhost',
  android: '10.0.2.2',
  default: 'localhost',
});

if (__DEV__ && process.env.NODE_ENV !== 'test') {
  Reactotron.setAsyncStorageHandler?.(AsyncStorage);

  Reactotron.configure({ name: 'MetaChrome', host })
    .useReactNative({
      asyncStorage: true,
      networking: { ignoreUrls: /symbolicate|logs|insights|expo/ },
      editor: false,
      overlay: false,
    })
    .connect();

  Reactotron.clear?.();
  console.tron = Reactotron;
}

export default Reactotron;
