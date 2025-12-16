#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');

const url = process.argv[2] || 'http://localhost:8081';
const platform = os.platform();

let command;

if (platform === 'darwin') {
  command = `open ${url}`;
} else if (platform === 'win32') {
  command = `start ${url}`;
} else {
  command = `xdg-open ${url}`;
}

exec(command, (error) => {
  if (error) {
    console.log(`🌐 Open this URL in your browser: ${url}`);
  } else {
    console.log(`🌐 Opening ${url} in your browser...`);
  }
});
