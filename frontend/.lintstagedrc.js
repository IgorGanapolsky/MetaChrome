module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'jest --bail --findRelatedTests',
  ],
  '*.{json,md}': ['prettier --write'],
};
