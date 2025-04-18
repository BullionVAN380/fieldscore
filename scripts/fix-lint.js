/**
 * Lint fixer script for Fieldscore
 * 
 * This script runs ESLint with the --fix flag to automatically fix
 * common linting issues across the codebase.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Files to check and fix
const filesToFix = [
  'src/services/errorReporting.ts',
  'src/utils/validation.ts',
  'src/utils/encryption.ts',
  'src/services/apiRateLimiter.ts',
  'src/services/apiClient.ts',
  'src/services/__tests__/errorReporting.test.ts',
  'src/services/__tests__/apiRateLimiter.test.ts',
  'src/utils/__tests__/validation.test.ts'
];

// Create __DEV__ declaration file if it doesn't exist
const devDeclarationPath = path.join(__dirname, '..', 'src', 'types', 'global.d.ts');
const devDeclarationDir = path.dirname(devDeclarationPath);

if (!fs.existsSync(devDeclarationDir)) {
  fs.mkdirSync(devDeclarationDir, { recursive: true });
}

if (!fs.existsSync(devDeclarationPath)) {
  fs.writeFileSync(
    devDeclarationPath,
    `/**
 * Global type declarations for Fieldscore
 */

declare const __DEV__: boolean;
`
  );
  console.log('Created global.d.ts with __DEV__ declaration');
}

// Run ESLint with fix option
try {
  console.log('Running ESLint with --fix option...');
  
  for (const file of filesToFix) {
    try {
      console.log(`Fixing ${file}...`);
      execSync(`npx eslint --fix "${file}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error fixing ${file}:`, error.message);
    }
  }
  
  console.log('Lint fixing complete!');
} catch (error) {
  console.error('Error running lint fix:', error.message);
  process.exit(1);
}
