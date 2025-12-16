module.exports = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  
  app: process.env.BROWSERSTACK_APP_ID || 'bs://your-app-id',
  
  build: {
    name: process.env.BROWSERSTACK_BUILD_NAME || `frontend-${new Date().toISOString()}`,
    debug: true,
  },

  testSuite: {
    name: 'Frontend App Tests',
  },

  devices: [
    {
      device: 'iPhone 14 Pro',
      os_version: '16',
    },
    {
      device: 'Samsung Galaxy S23',
      os_version: '13.0',
    },
    {
      device: 'Google Pixel 7',
      os_version: '13.0',
    },
  ],

  // For App Live (interactive testing)
  appLive: {
    enabled: true,
    timeout: 300,
  },
};
