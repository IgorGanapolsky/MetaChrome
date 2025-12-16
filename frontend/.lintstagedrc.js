module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write', 'jest --bail --findRelatedTests'],
  '*.{js,jsx,json,md}': ['prettier --write'],
};
