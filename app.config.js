// Extends app.json. Push notifications on Android need Firebase's google-services.json
// (see README → Push notifications); it's only wired in once the file exists, so builds
// without it still work, just without push.
const { existsSync } = require('node:fs');

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}),
  },
});
