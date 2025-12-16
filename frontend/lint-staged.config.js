/**
 * lint-staged configuration
 * Runs on staged files before commit
 */
module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx}': [
    // Run ESLint with auto-fix
    'eslint --fix --max-warnings 0',
    // Run Prettier
    'prettier --write',
    // Type check (on all files, not just staged)
    () => 'tsc --noEmit',
    // Run tests related to staged files
    'jest --bail --findRelatedTests --passWithNoTests',
  ],

  // JavaScript files (config files, etc.)
  '*.{js,jsx}': ['eslint --fix --max-warnings 0', 'prettier --write'],

  // JSON files
  '*.json': ['prettier --write'],

  // Markdown files
  '*.md': ['prettier --write'],
};
