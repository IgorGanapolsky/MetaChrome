/**
 * BluetoothAudioManager
 *
 * Manages Bluetooth audio connections for Meta Ray-Ban smart glasses.
 * Handles the Android SCO (Synchronous Connection-Oriented) workaround
 * to ensure speech recognition uses the Bluetooth microphone.
 */

import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, NativeModules } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Meta Ray-Ban device name patterns for identification
const META_DEVICE_NAME_PATTERNS = ['Ray-Ban', 'Meta', 'Oakley'];

export interface BluetoothDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isConnected: boolean;
  batteryLevel: number | null;
  isMetaGlasses: boolean;
}

export interface BluetoothAudioState {
  isScanning: boolean;
  isBluetoothEnabled: boolean;
  connectedDevice: BluetoothDevice | null;
  discoveredDevices: BluetoothDevice[];
  isAudioRouted: boolean;
  lastError: string | null;

  // Actions
  setScanning: (scanning: boolean) => void;
  setBluetoothEnabled: (enabled: boolean) => void;
  setConnectedDevice: (device: BluetoothDevice | null) => void;
  addDiscoveredDevice: (device: BluetoothDevice) => void;
  clearDiscoveredDevices: () => void;
  setAudioRouted: (routed: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBluetoothStore = create<BluetoothAudioState>()(
  persist(
    (set, get) => ({
      isScanning: false,
      isBluetoothEnabled: false,
      connectedDevice: null,
      discoveredDevices: [],
      isAudioRouted: false,
      lastError: null,

      setScanning: (scanning) => set({ isScanning: scanning }),
      setBluetoothEnabled: (enabled) => set({ isBluetoothEnabled: enabled }),
      setConnectedDevice: (device) => set({ connectedDevice: device }),
      addDiscoveredDevice: (device) => {
        const existing = get().discoveredDevices;
        const exists = existing.find((d) => d.id === device.id);
        if (!exists) {
          set({ discoveredDevices: [...existing, device] });
        }
      },
      clearDiscoveredDevices: () => set({ discoveredDevices: [] }),
      setAudioRouted: (routed) => set({ isAudioRouted: routed }),
      setError: (error) => set({ lastError: error }),
    }),
    {
      name: 'bluetooth-audio-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        connectedDevice: state.connectedDevice,
      }),
    }
  )
);

class BluetoothAudioManager {
  private bleManager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private isInitialized = false;

  constructor() {
    this.bleManager = this.createBleManager();
  }

  private createBleManager(): BleManager | null {
    if (!NativeModules.BlePlx) {
      useBluetoothStore
        .getState()
        .setError('Bluetooth not available in this build. Use a dev client or native build.');
      return null;
    }

    try {
      return new BleManager();
    } catch (error) {
      useBluetoothStore.getState().setError(`Bluetooth initialization failed: ${error}`);
      return null;
    }
  }

  private getManager(): BleManager | null {
    if (!this.bleManager) {
      this.bleManager = this.createBleManager();
    }
    return this.bleManager;
  }

  /**
   * Initialize the Bluetooth manager and check permissions
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const manager = this.getManager();
      if (!manager) {
        useBluetoothStore.getState().setBluetoothEnabled(false);
        return false;
      }

      const state = await (manager as { state: () => Promise<State> }).state();

      if (String(state) === 'PoweredOff') {
        useBluetoothStore.getState().setError('Bluetooth is turned off');
        useBluetoothStore.getState().setBluetoothEnabled(false);
        return false;
      }

      if (String(state) === 'Unauthorized') {
        useBluetoothStore.getState().setError('Bluetooth permission not granted');
        return false;
      }

      useBluetoothStore.getState().setBluetoothEnabled(true);
      this.isInitialized = true;

      // Listen for state changes
      manager.onStateChange((newState: State) => {
        useBluetoothStore.getState().setBluetoothEnabled(String(newState) === 'PoweredOn');
      }, true);

      return true;
    } catch (error) {
      useBluetoothStore.getState().setError(`Initialization failed: ${error}`);
      return false;
    }
  }

  /**
   * Check if a device is Meta Ray-Ban glasses
   */
  private isMetaGlasses(device: Device): boolean {
    const name = device.name || device.localName || '';
    return META_DEVICE_NAME_PATTERNS.some((pattern) =>
      name.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Scan for nearby Bluetooth devices
   */
  async startScan(durationMs: number = 10000): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const manager = this.getManager();
    if (!manager) {
      useBluetoothStore.getState().setScanning(false);
      return;
    }

    useBluetoothStore.getState().clearDiscoveredDevices();
    useBluetoothStore.getState().setScanning(true);
    useBluetoothStore.getState().setError(null);

    return new Promise((resolve) => {
      manager.startDeviceScan(
        null, // Scan for all devices
        { allowDuplicates: false },
        (error: unknown, device: Device | null) => {
          if (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            useBluetoothStore.getState().setError(`Scan error: ${errorMessage}`);
            useBluetoothStore.getState().setScanning(false);
            resolve();
            return;
          }

          if (device && (device.name || device.localName)) {
            const bluetoothDevice: BluetoothDevice = {
              id: device.id,
              name: device.name || device.localName,
              rssi: device.rssi,
              isConnected: false,
              batteryLevel: null,
              isMetaGlasses: this.isMetaGlasses(device),
            };
            useBluetoothStore.getState().addDiscoveredDevice(bluetoothDevice);
          }
        }
      );

      // Stop scanning after duration
      setTimeout(() => {
        this.stopScan();
        resolve();
      }, durationMs);
    });
  }

  /**
   * Stop scanning for devices
   */
  stopScan(): void {
    const manager = this.getManager();
    if (!manager) {
      useBluetoothStore.getState().setScanning(false);
      return;
    }

    manager.stopDeviceScan();
    useBluetoothStore.getState().setScanning(false);
  }

  /**
   * Connect to a Bluetooth device
   */
  async connect(deviceId: string): Promise<boolean> {
    try {
      const manager = this.getManager();
      if (!manager) {
        return false;
      }

      useBluetoothStore.getState().setError(null);

      // Connect to the device
      const connectMethod = (
        manager as {
          connectToDevice: (id: string, options: { autoConnect: boolean }) => Promise<Device>;
        }
      ).connectToDevice;
      const device = await connectMethod(deviceId, {
        autoConnect: true,
      });

      // Discover services
      if (
        (device as unknown as { discoverAllServicesAndCharacteristics: () => Promise<unknown> })
          .discoverAllServicesAndCharacteristics
      ) {
        await (
          device as unknown as { discoverAllServicesAndCharacteristics: () => Promise<unknown> }
        ).discoverAllServicesAndCharacteristics();
      }

      this.connectedDevice = device;

      const bluetoothDevice: BluetoothDevice = {
        id: (device as Device).id || deviceId,
        name: (device as Device).name || (device as Device).localName || null,
        rssi: (device as { rssi?: number | null }).rssi || null,
        isConnected: true,
        batteryLevel: null,
        isMetaGlasses: this.isMetaGlasses(device as Device),
      };

      useBluetoothStore.getState().setConnectedDevice(bluetoothDevice);

      // Set up disconnection listener
      if (device.onDisconnected) {
        device.onDisconnected((error: unknown, disconnectedDevice: unknown) => {
          const deviceId = (disconnectedDevice as Device)?.id || 'unknown';
          console.log('Device disconnected:', deviceId);
          useBluetoothStore.getState().setConnectedDevice(null);
          useBluetoothStore.getState().setAudioRouted(false);
          this.connectedDevice = null;
        });
      }

      // Route audio to Bluetooth device
      await this.routeAudioToBluetooth();

      return true;
    } catch (error) {
      useBluetoothStore.getState().setError(`Connection failed: ${error}`);
      return false;
    }
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.unrouteAudioFromBluetooth();
        if (
          (this.connectedDevice as unknown as { cancelConnection: () => Promise<unknown> })
            .cancelConnection
        ) {
          await (
            this.connectedDevice as unknown as { cancelConnection: () => Promise<unknown> }
          ).cancelConnection();
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      this.connectedDevice = null;
      useBluetoothStore.getState().setConnectedDevice(null);
    }
  }

  /**
   * Route audio input/output to Bluetooth device
   * This is the critical workaround for Android to use Bluetooth mic for speech recognition
   */
  async routeAudioToBluetooth(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android: Start Bluetooth SCO (Synchronous Connection-Oriented) link
        // This routes the microphone input from the Bluetooth headset
        const { AudioManager } = NativeModules;

        if (AudioManager) {
          // Start Bluetooth SCO for microphone routing
          await AudioManager.startBluetoothSco();
          // Set audio mode to communication for voice
          await AudioManager.setMode('MODE_IN_COMMUNICATION');
          // Enable speaker phone off to use Bluetooth
          await AudioManager.setSpeakerphoneOn(false);
          // Set Bluetooth SCO on
          await AudioManager.setBluetoothScoOn(true);
        } else {
          // Fallback: Log that native module is not available
          console.warn(
            'AudioManager native module not available. Audio routing may not work correctly.'
          );
        }
      } else if (Platform.OS === 'ios') {
        // iOS: Audio routing is handled automatically by the system
        // when a Bluetooth audio device is connected
        // We just need to set the audio session category correctly
        const { AudioSession } = NativeModules;

        if (AudioSession) {
          await AudioSession.setCategory('playAndRecord', {
            allowBluetooth: true,
            allowBluetoothA2DP: true,
            defaultToSpeaker: false,
          });
        }
      }

      useBluetoothStore.getState().setAudioRouted(true);
      return true;
    } catch (error) {
      console.error('Failed to route audio to Bluetooth:', error);
      useBluetoothStore.getState().setError(`Audio routing failed: ${error}`);
      return false;
    }
  }

  /**
   * Unroute audio from Bluetooth back to device
   */
  async unrouteAudioFromBluetooth(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        const { AudioManager } = NativeModules;

        if (AudioManager) {
          await AudioManager.stopBluetoothSco();
          await AudioManager.setBluetoothScoOn(false);
          await AudioManager.setMode('MODE_NORMAL');
        }
      }

      useBluetoothStore.getState().setAudioRouted(false);
    } catch (error) {
      console.error('Failed to unroute audio:', error);
    }
  }

  /**
   * Check if currently connected to Meta glasses
   */
  isConnectedToMetaGlasses(): boolean {
    const device = useBluetoothStore.getState().connectedDevice;
    return (device?.isConnected && device?.isMetaGlasses) || false;
  }

  /**
   * Get the BLE manager instance for advanced operations
   */
  getBleManager(): BleManager {
    if (!this.bleManager) {
      this.bleManager = this.createBleManager();
    }
    return this.bleManager as BleManager;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopScan();
    this.disconnect();
    if (this.bleManager) {
      this.bleManager.destroy();
    }
  }
}

// Singleton instance
export const bluetoothAudioManager = new BluetoothAudioManager();
