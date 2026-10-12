// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Reacticx components are copied in by `npx reacticx add` and updated with `npx reacticx diff`.
    // They are linted by their authors, so we don't hold them to our React Compiler rules.
    ignores: ['dist/*', 'src/components/reacticx/**', 'src/shared/**'],
  },
]);
