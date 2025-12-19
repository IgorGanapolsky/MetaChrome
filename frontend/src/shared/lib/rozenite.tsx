import React from 'react';
import { useReactNavigationDevTools } from '@rozenite/react-navigation-plugin';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

type Props = {
  navigationRef: NavigationContainerRefWithCurrent<any>;
};

export function RozeniteDevTools({ navigationRef }: Props) {
  useReactNavigationDevTools({ ref: navigationRef });
  return null;
}
