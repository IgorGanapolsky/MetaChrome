// Workaround for jest-expo React 19 compatibility
// This file patches the issue before jest-expo setup runs

// Mock React before jest-expo tries to set properties
const React = require('react');
if (!React.version) {
  Object.defineProperty(React, 'version', {
    value: '19.0.0',
    writable: false,
    configurable: true,
  });
}

// Continue with normal setup
require('./jest.setup.js');
