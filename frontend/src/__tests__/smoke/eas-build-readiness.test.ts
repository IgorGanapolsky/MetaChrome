/**
 * EAS Build Readiness Smoke Tests
 *
 * These tests verify that the project is properly configured for EAS builds.
 * They catch configuration issues before they cause build failures.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');

describe('EAS Build Readiness', () => {
  describe('Required Files', () => {
    const requiredFiles = [
      'app.config.js',
      'app.json',
      'eas.json',
      'package.json',
      'tsconfig.json',
      'babel.config.js',
      'metro.config.js',
    ];

    test.each(requiredFiles)('%s exists', (file) => {
      const filePath = path.join(ROOT, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('app.config.js', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let config: { expo: Record<string, any> };

    beforeAll(() => {
      const configPath = path.join(ROOT, 'app.config.js');
      // Clear require cache
      delete require.cache[require.resolve(configPath)];
      config = require(configPath);
    });

    test('has expo object', () => {
      expect(config.expo).toBeDefined();
    });

    test('has required slug', () => {
      expect(config.expo.slug).toBeDefined();
      expect(typeof config.expo.slug).toBe('string');
      expect(config.expo.slug.length).toBeGreaterThan(0);
    });

    test('has required version', () => {
      expect(config.expo.version).toBeDefined();
      expect(config.expo.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('has owner field for EAS', () => {
      expect(config.expo.owner).toBeDefined();
      expect(config.expo.owner).toBe('igorganapolsky');
    });

    test('has EAS projectId', () => {
      const extra = config.expo.extra as Record<string, unknown>;
      const eas = extra?.eas as Record<string, unknown>;
      expect(eas?.projectId).toBeDefined();
      expect(typeof eas?.projectId).toBe('string');
    });

    test('has iOS bundleIdentifier', () => {
      const ios = config.expo.ios as Record<string, unknown>;
      expect(ios?.bundleIdentifier).toBeDefined();
      expect(ios?.bundleIdentifier).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i);
    });

    test('has Android package', () => {
      const android = config.expo.android as Record<string, unknown>;
      expect(android?.package).toBeDefined();
      expect(android?.package).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i);
    });

    test('iOS and Android identifiers match', () => {
      const ios = config.expo.ios as Record<string, unknown>;
      const android = config.expo.android as Record<string, unknown>;
      expect(ios?.bundleIdentifier).toBe(android?.package);
    });

    test('has plugins array', () => {
      expect(Array.isArray(config.expo.plugins)).toBe(true);
    });

    test('has expo-router plugin', () => {
      const plugins = config.expo.plugins as Array<string | [string, unknown]>;
      const pluginNames = plugins.map((p) => (typeof p === 'string' ? p : p[0]));
      expect(pluginNames).toContain('expo-router');
    });
  });

  describe('eas.json', () => {
    let eas: Record<string, unknown>;

    beforeAll(() => {
      const easPath = path.join(ROOT, 'eas.json');
      eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
    });

    test('has cli configuration', () => {
      expect(eas.cli).toBeDefined();
    });

    test('has build configuration', () => {
      expect(eas.build).toBeDefined();
    });

    const requiredProfiles = ['development', 'preview', 'production'];

    test.each(requiredProfiles)('has %s build profile', (profile) => {
      const build = eas.build as Record<string, unknown>;
      expect(build[profile]).toBeDefined();
    });

    test('preview profile has Android APK buildType', () => {
      const build = eas.build as Record<string, unknown>;
      const preview = build.preview as Record<string, unknown>;
      const android = preview?.android as Record<string, unknown>;
      expect(android?.buildType).toBe('apk');
    });

    test('node version is valid format', () => {
      const build = eas.build as Record<string, Record<string, unknown>>;

      for (const [profileName, profile] of Object.entries(build)) {
        if (profile.node) {
          expect(profile.node).toMatch(/^\d+\.\d+\.\d+$/);

          // Check major version is reasonable
          const major = parseInt(String(profile.node).split('.')[0]);
          expect(major).toBeGreaterThanOrEqual(18);
          expect(major).toBeLessThanOrEqual(22);
        }
      }
    });
  });

  describe('package.json', () => {
    let pkg: Record<string, unknown>;

    beforeAll(() => {
      const pkgPath = path.join(ROOT, 'package.json');
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    });

    test('has name', () => {
      expect(pkg.name).toBeDefined();
    });

    test('has expo dependency', () => {
      const deps = pkg.dependencies as Record<string, string>;
      expect(deps.expo).toBeDefined();
    });

    test('has react-native dependency', () => {
      const deps = pkg.dependencies as Record<string, string>;
      expect(deps['react-native']).toBeDefined();
    });

    test('has required scripts', () => {
      const scripts = pkg.scripts as Record<string, string>;
      expect(scripts.start).toBeDefined();
      expect(scripts.lint).toBeDefined();
      expect(scripts.test).toBeDefined();
    });

    test('has validate:config script', () => {
      const scripts = pkg.scripts as Record<string, string>;
      expect(scripts['validate:config']).toBeDefined();
    });
  });

  describe('.gitignore', () => {
    let gitignore: string;

    beforeAll(() => {
      const gitignorePath = path.join(ROOT, '.gitignore');
      gitignore = fs.readFileSync(gitignorePath, 'utf8');
    });

    test('ignores android folder', () => {
      expect(gitignore).toMatch(/android\/?/);
    });

    test('ignores ios folder', () => {
      expect(gitignore).toMatch(/ios\/?/);
    });

    test('ignores node_modules', () => {
      expect(gitignore).toMatch(/node_modules\/?/);
    });

    test('ignores .expo folder', () => {
      expect(gitignore).toMatch(/\.expo\/?/);
    });
  });

  describe('Custom Plugins', () => {
    const customPlugins = ['plugins/withMetaChrome.js', 'plugins/withAccessibilityService.js'];

    test.each(customPlugins)('%s exists and is valid JS', (plugin) => {
      const pluginPath = path.join(ROOT, plugin);
      expect(fs.existsSync(pluginPath)).toBe(true);

      // Try to require it to check for syntax errors
      expect(() => {
        delete require.cache[require.resolve(pluginPath)];
        require(pluginPath);
      }).not.toThrow();
    });
  });

  describe('Assets', () => {
    const requiredAssets = [
      'assets/images/icon.png',
      'assets/images/adaptive-icon.png',
      'assets/images/splash-icon.png',
    ];

    test.each(requiredAssets)('%s exists', (asset) => {
      const assetPath = path.join(ROOT, asset);
      expect(fs.existsSync(assetPath)).toBe(true);
    });
  });
});
