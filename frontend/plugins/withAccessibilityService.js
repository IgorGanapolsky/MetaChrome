/**
 * Expo Config Plugin for Android AccessibilityService
 *
 * This plugin configures the native Android AccessibilityService that allows
 * MetaChrome to control other apps like Chrome, read screen content, and
 * perform actions on behalf of the user.
 */

const {
  withAndroidManifest,
  withDangerousMod,
  withPlugins,
  withMainApplication,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Register the native module package in MainApplication
 */
function withAccessibilityPackageRegistration(config) {
  return withMainApplication(config, async (config) => {
    let mainApplication = config.modResults.contents;
    const packageName = config.android?.package || 'com.metachrome.app';

    // Add import if not present
    const importStatement = `import ${packageName}.MetaChromeAccessibilityPackage;`;
    if (!mainApplication.includes(importStatement)) {
      // Add import after the last import statement
      const lastImportIndex = mainApplication.lastIndexOf('import ');
      const endOfImportLine = mainApplication.indexOf('\n', lastImportIndex);
      mainApplication =
        mainApplication.slice(0, endOfImportLine + 1) +
        importStatement +
        '\n' +
        mainApplication.slice(endOfImportLine + 1);
    }

    // Add package to getPackages() if not present
    const packageRegistration = 'packages.add(new MetaChromeAccessibilityPackage());';
    if (!mainApplication.includes('MetaChromeAccessibilityPackage')) {
      // Find getPackages method and add our package
      const getPackagesMatch = mainApplication.match(
        /protected List<ReactPackage> getPackages\(\) \{[\s\S]*?return packages;/
      );
      if (getPackagesMatch) {
        const insertPoint = mainApplication.indexOf(
          'return packages;',
          mainApplication.indexOf('getPackages')
        );
        mainApplication =
          mainApplication.slice(0, insertPoint) +
          packageRegistration +
          '\n      ' +
          mainApplication.slice(insertPoint);
      }
    }

    config.modResults.contents = mainApplication;
    return config;
  });
}

/**
 * Add AccessibilityService to Android manifest
 */
function withAccessibilityManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application[0];

    // Add the AccessibilityService
    if (!application.service) {
      application.service = [];
    }

    const hasAccessibilityService = application.service.some(
      (s) => s.$['android:name'] === '.MetaChromeAccessibilityService'
    );

    if (!hasAccessibilityService) {
      application.service.push({
        $: {
          'android:name': '.MetaChromeAccessibilityService',
          'android:label': '@string/accessibility_service_label',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
      });
    }

    // Add SYSTEM_ALERT_WINDOW permission for overlay (optional, for visual feedback)
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const overlayPermission = 'android.permission.SYSTEM_ALERT_WINDOW';
    const hasOverlayPermission = manifest['uses-permission'].some(
      (p) => p.$['android:name'] === overlayPermission
    );

    if (!hasOverlayPermission) {
      manifest['uses-permission'].push({
        $: { 'android:name': overlayPermission },
      });
    }

    return config;
  });
}

/**
 * Create the accessibility service configuration XML
 */
function withAccessibilityConfig(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Create accessibility service config
      const accessibilityConfig = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagIncludeNotImportantViews|flagRequestTouchExplorationMode|flagReportViewIds"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100"
    android:settingsActivity="com.metachrome.app.MainActivity" />
`;

      fs.writeFileSync(path.join(xmlDir, 'accessibility_service_config.xml'), accessibilityConfig);

      return config;
    },
  ]);
}

/**
 * Add string resources for the accessibility service
 */
function withAccessibilityStrings(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const stringsPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'values',
        'strings.xml'
      );

      if (fs.existsSync(stringsPath)) {
        let stringsContent = fs.readFileSync(stringsPath, 'utf8');

        // Add accessibility service strings if not present
        if (!stringsContent.includes('accessibility_service_label')) {
          const newStrings = `
    <string name="accessibility_service_label">MetaChrome Voice Control</string>
    <string name="accessibility_service_description">Allows MetaChrome to control other apps using voice commands from your Meta Ray-Ban glasses. This enables hands-free browsing, reading content, and interacting with apps like Chrome.</string>
`;
          stringsContent = stringsContent.replace('</resources>', `${newStrings}</resources>`);
          fs.writeFileSync(stringsPath, stringsContent);
        }
      }

      return config;
    },
  ]);
}

/**
 * Create the native AccessibilityService Java file
 */
function withAccessibilityServiceJava(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android?.package || 'com.metachrome.app';
      const packagePath = packageName.replace(/\./g, '/');
      const javaDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(javaDir)) {
        fs.mkdirSync(javaDir, { recursive: true });
      }

      // Create the AccessibilityService
      const serviceCode = `package ${packageName};

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.accessibilityservice.GestureDescription;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Path;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayList;
import java.util.List;

public class MetaChromeAccessibilityService extends AccessibilityService {
    private static final String TAG = "MetaChromeA11y";
    private static MetaChromeAccessibilityService instance;
    private String currentPackageName = "";

    public static MetaChromeAccessibilityService getInstance() {
        return instance;
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        Log.d(TAG, "Accessibility service connected");

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPES_ALL_MASK;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
                | AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
                | AccessibilityServiceInfo.FLAG_REQUEST_TOUCH_EXPLORATION_MODE;
        info.notificationTimeout = 100;
        setServiceInfo(info);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        CharSequence packageName = event.getPackageName();
        if (packageName != null) {
            currentPackageName = packageName.toString();
        }
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
        Log.d(TAG, "Accessibility service destroyed");
    }

    // ==================== Public Methods ====================

    public String getCurrentPackageName() {
        return currentPackageName;
    }

    public boolean openApp(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            Intent intent = pm.getLaunchIntentForPackage(packageName);
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error opening app: " + e.getMessage());
        }
        return false;
    }

    public boolean openChrome(String url) {
        try {
            Intent intent;
            if (url != null && !url.isEmpty()) {
                intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            } else {
                intent = getPackageManager().getLaunchIntentForPackage("com.android.chrome");
            }
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error opening Chrome: " + e.getMessage());
        }
        return false;
    }

    public String getScreenContent() {
        StringBuilder content = new StringBuilder();
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode != null) {
            extractText(rootNode, content);
            rootNode.recycle();
        }
        return content.toString();
    }

    private void extractText(AccessibilityNodeInfo node, StringBuilder content) {
        if (node == null) return;

        CharSequence text = node.getText();
        if (text != null && text.length() > 0) {
            content.append(text).append(" ");
        }

        CharSequence contentDesc = node.getContentDescription();
        if (contentDesc != null && contentDesc.length() > 0) {
            content.append(contentDesc).append(" ");
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                extractText(child, content);
                child.recycle();
            }
        }
    }

    public boolean clickByText(String text) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return false;

        List<AccessibilityNodeInfo> nodes = rootNode.findAccessibilityNodeInfosByText(text);
        for (AccessibilityNodeInfo node : nodes) {
            if (node.isClickable()) {
                boolean result = node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                node.recycle();
                rootNode.recycle();
                return result;
            }
            // Try parent if node itself is not clickable
            AccessibilityNodeInfo parent = node.getParent();
            while (parent != null) {
                if (parent.isClickable()) {
                    boolean result = parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    parent.recycle();
                    node.recycle();
                    rootNode.recycle();
                    return result;
                }
                AccessibilityNodeInfo temp = parent;
                parent = parent.getParent();
                temp.recycle();
            }
            node.recycle();
        }
        rootNode.recycle();
        return false;
    }

    public boolean clickByCoordinates(float x, float y) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Path clickPath = new Path();
            clickPath.moveTo(x, y);
            GestureDescription.StrokeDescription clickStroke =
                    new GestureDescription.StrokeDescription(clickPath, 0, 100);
            GestureDescription.Builder gestureBuilder = new GestureDescription.Builder();
            gestureBuilder.addStroke(clickStroke);
            return dispatchGesture(gestureBuilder.build(), null, null);
        }
        return false;
    }

    public boolean scrollUp() {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode != null) {
            boolean result = findScrollableAndScroll(rootNode, AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD);
            rootNode.recycle();
            return result;
        }
        return false;
    }

    public boolean scrollDown() {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode != null) {
            boolean result = findScrollableAndScroll(rootNode, AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
            rootNode.recycle();
            return result;
        }
        return false;
    }

    private boolean findScrollableAndScroll(AccessibilityNodeInfo node, int action) {
        if (node == null) return false;

        if (node.isScrollable()) {
            return node.performAction(action);
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                if (findScrollableAndScroll(child, action)) {
                    child.recycle();
                    return true;
                }
                child.recycle();
            }
        }
        return false;
    }

    public boolean typeText(String text) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return false;

        AccessibilityNodeInfo focusedNode = rootNode.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (focusedNode != null && focusedNode.isEditable()) {
            Bundle arguments = new Bundle();
            arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
            boolean result = focusedNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);
            focusedNode.recycle();
            rootNode.recycle();
            return result;
        }

        // Try to find any editable field
        boolean result = findEditableAndType(rootNode, text);
        rootNode.recycle();
        return result;
    }

    private boolean findEditableAndType(AccessibilityNodeInfo node, String text) {
        if (node == null) return false;

        if (node.isEditable()) {
            Bundle arguments = new Bundle();
            arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
            return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                if (findEditableAndType(child, text)) {
                    child.recycle();
                    return true;
                }
                child.recycle();
            }
        }
        return false;
    }

    public boolean pressBack() {
        return performGlobalAction(GLOBAL_ACTION_BACK);
    }

    public boolean pressHome() {
        return performGlobalAction(GLOBAL_ACTION_HOME);
    }

    public boolean pressRecents() {
        return performGlobalAction(GLOBAL_ACTION_RECENTS);
    }
}
`;

      fs.writeFileSync(path.join(javaDir, 'MetaChromeAccessibilityService.java'), serviceCode);

      return config;
    },
  ]);
}

/**
 * Create the React Native native module for accessibility
 */
function withAccessibilityNativeModule(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android?.package || 'com.metachrome.app';
      const packagePath = packageName.replace(/\./g, '/');
      const javaDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath);

      // Create the Native Module
      const moduleCode = `package ${packageName};

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = MetaChromeAccessibilityModule.NAME)
public class MetaChromeAccessibilityModule extends ReactContextBaseJavaModule {
    public static final String NAME = "MetaChromeAccessibility";
    private final ReactApplicationContext reactContext;

    public MetaChromeAccessibilityModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void isAccessibilityEnabled(Promise promise) {
        try {
            int accessibilityEnabled = Settings.Secure.getInt(
                    reactContext.getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED, 0);
            promise.resolve(accessibilityEnabled == 1);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isServiceRunning(Promise promise) {
        promise.resolve(MetaChromeAccessibilityService.getInstance() != null);
    }

    @ReactMethod
    public void openAccessibilitySettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openApp(String packageName, Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.openApp(packageName));
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void openChrome(String url, Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.openChrome(url));
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void getCurrentApp(Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.getCurrentPackageName());
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void getScreenContent(Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.getScreenContent());
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void clickByText(String text, Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.clickByText(text));
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void clickByCoordinates(float x, float y, Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.clickByCoordinates(x, y));
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void scrollUp(Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.scrollUp());
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void scrollDown(Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.scrollDown());
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void typeText(String text, Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.typeText(text));
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void pressBack(Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.pressBack());
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void pressHome(Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.pressHome());
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }

    @ReactMethod
    public void pressRecents(Promise promise) {
        MetaChromeAccessibilityService service = MetaChromeAccessibilityService.getInstance();
        if (service != null) {
            promise.resolve(service.pressRecents());
        } else {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running");
        }
    }
}
`;

      fs.writeFileSync(path.join(javaDir, 'MetaChromeAccessibilityModule.java'), moduleCode);

      // Create the Package file
      const packageCode = `package ${packageName};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MetaChromeAccessibilityPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new MetaChromeAccessibilityModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;

      fs.writeFileSync(path.join(javaDir, 'MetaChromeAccessibilityPackage.java'), packageCode);

      return config;
    },
  ]);
}

/**
 * Main plugin function
 */
module.exports = function withAccessibilityService(config) {
  return withPlugins(config, [
    withAccessibilityManifest,
    withAccessibilityConfig,
    withAccessibilityStrings,
    withAccessibilityServiceJava,
    withAccessibilityNativeModule,
    withAccessibilityPackageRegistration,
  ]);
};
