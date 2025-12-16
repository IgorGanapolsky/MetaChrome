// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [new FileStore({ root: path.join(root, 'cache') })];

// Path aliases for FSD structure
config.resolver.alias = {
  '@/app': path.resolve(__dirname, 'app'),
  '@/pages': path.resolve(__dirname, 'src/pages'),
  '@/widgets': path.resolve(__dirname, 'src/widgets'),
  '@/features': path.resolve(__dirname, 'src/features'),
  '@/entities': path.resolve(__dirname, 'src/entities'),
  '@/shared': path.resolve(__dirname, 'src/shared'),
  '@/services': path.resolve(__dirname, 'src/services'),
  '@/types': path.resolve(__dirname, 'src/types'),
  '@/theme': path.resolve(__dirname, 'src/theme'),
};

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
