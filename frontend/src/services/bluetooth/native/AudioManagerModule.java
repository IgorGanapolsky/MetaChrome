/**
 * AudioManagerModule.java
 * 
 * Native Android module for managing audio routing to Bluetooth devices.
 * This is required to make speech recognition use the Bluetooth microphone
 * instead of the phone's built-in microphone.
 * 
 * Place this file in: android/app/src/main/java/com/metachrome/AudioManagerModule.java
 */

package com.metachrome;

import android.content.Context;
import android.media.AudioManager;
import android.os.Build;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AudioManagerModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "AudioManager";
    private AudioManager audioManager;
    private ReactApplicationContext reactContext;
    private BroadcastReceiver scoReceiver;
    private boolean isScoReceiverRegistered = false;

    public AudioManagerModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Start Bluetooth SCO (Synchronous Connection-Oriented) link.
     * This routes the microphone input from the Bluetooth headset.
     */
    @ReactMethod
    public void startBluetoothSco(Promise promise) {
        try {
            if (audioManager == null) {
                promise.reject("ERROR", "AudioManager not available");
                return;
            }

            // Register receiver for SCO state changes
            if (!isScoReceiverRegistered) {
                registerScoReceiver();
            }

            // Check if Bluetooth SCO is available
            if (!audioManager.isBluetoothScoAvailableOffCall()) {
                promise.reject("ERROR", "Bluetooth SCO not available off call");
                return;
            }

            // Start Bluetooth SCO
            audioManager.startBluetoothSco();
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Stop Bluetooth SCO link.
     */
    @ReactMethod
    public void stopBluetoothSco(Promise promise) {
        try {
            if (audioManager != null) {
                audioManager.stopBluetoothSco();
            }
            
            if (isScoReceiverRegistered) {
                unregisterScoReceiver();
            }
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Set Bluetooth SCO on/off.
     */
    @ReactMethod
    public void setBluetoothScoOn(boolean on, Promise promise) {
        try {
            if (audioManager != null) {
                audioManager.setBluetoothScoOn(on);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Set audio mode.
     * Modes: MODE_NORMAL, MODE_RINGTONE, MODE_IN_CALL, MODE_IN_COMMUNICATION
     */
    @ReactMethod
    public void setMode(String mode, Promise promise) {
        try {
            if (audioManager == null) {
                promise.reject("ERROR", "AudioManager not available");
                return;
            }

            int audioMode;
            switch (mode) {
                case "MODE_NORMAL":
                    audioMode = AudioManager.MODE_NORMAL;
                    break;
                case "MODE_RINGTONE":
                    audioMode = AudioManager.MODE_RINGTONE;
                    break;
                case "MODE_IN_CALL":
                    audioMode = AudioManager.MODE_IN_CALL;
                    break;
                case "MODE_IN_COMMUNICATION":
                    audioMode = AudioManager.MODE_IN_COMMUNICATION;
                    break;
                default:
                    audioMode = AudioManager.MODE_NORMAL;
            }

            audioManager.setMode(audioMode);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Set speakerphone on/off.
     */
    @ReactMethod
    public void setSpeakerphoneOn(boolean on, Promise promise) {
        try {
            if (audioManager != null) {
                audioManager.setSpeakerphoneOn(on);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Check if Bluetooth SCO is available.
     */
    @ReactMethod
    public void isBluetoothScoAvailable(Promise promise) {
        try {
            if (audioManager != null) {
                boolean available = audioManager.isBluetoothScoAvailableOffCall();
                promise.resolve(available);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Check if Bluetooth SCO is currently on.
     */
    @ReactMethod
    public void isBluetoothScoOn(Promise promise) {
        try {
            if (audioManager != null) {
                boolean on = audioManager.isBluetoothScoOn();
                promise.resolve(on);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Get current audio mode.
     */
    @ReactMethod
    public void getMode(Promise promise) {
        try {
            if (audioManager != null) {
                int mode = audioManager.getMode();
                String modeName;
                switch (mode) {
                    case AudioManager.MODE_NORMAL:
                        modeName = "MODE_NORMAL";
                        break;
                    case AudioManager.MODE_RINGTONE:
                        modeName = "MODE_RINGTONE";
                        break;
                    case AudioManager.MODE_IN_CALL:
                        modeName = "MODE_IN_CALL";
                        break;
                    case AudioManager.MODE_IN_COMMUNICATION:
                        modeName = "MODE_IN_COMMUNICATION";
                        break;
                    default:
                        modeName = "UNKNOWN";
                }
                promise.resolve(modeName);
            } else {
                promise.resolve("UNKNOWN");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    private void registerScoReceiver() {
        scoReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                int state = intent.getIntExtra(AudioManager.EXTRA_SCO_AUDIO_STATE, -1);
                
                WritableMap params = Arguments.createMap();
                
                switch (state) {
                    case AudioManager.SCO_AUDIO_STATE_CONNECTED:
                        params.putString("state", "connected");
                        break;
                    case AudioManager.SCO_AUDIO_STATE_DISCONNECTED:
                        params.putString("state", "disconnected");
                        break;
                    case AudioManager.SCO_AUDIO_STATE_CONNECTING:
                        params.putString("state", "connecting");
                        break;
                    default:
                        params.putString("state", "unknown");
                }
                
                sendEvent("BluetoothScoStateChanged", params);
            }
        };

        IntentFilter filter = new IntentFilter(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED);
        reactContext.registerReceiver(scoReceiver, filter);
        isScoReceiverRegistered = true;
    }

    private void unregisterScoReceiver() {
        if (scoReceiver != null && isScoReceiverRegistered) {
            try {
                reactContext.unregisterReceiver(scoReceiver);
            } catch (Exception e) {
                // Receiver may not be registered
            }
            isScoReceiverRegistered = false;
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}
