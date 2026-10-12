const { palette, fonts } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: palette,
      fontFamily: {
        display: [fonts.display],
        'display-bold': [fonts.displayBold],
        body: [fonts.body],
        'body-medium': [fonts.bodyMedium],
        'body-semibold': [fonts.bodySemibold],
        'body-bold': [fonts.bodyBold],
        'body-extrabold': [fonts.bodyExtrabold],
      },
      borderRadius: {
        card: '22px',
        tile: '16px',
      },
    },
  },
  plugins: [],
};
