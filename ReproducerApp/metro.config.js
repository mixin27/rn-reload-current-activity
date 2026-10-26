const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Reproducer only: delay bundle responses so a reload takes as long as it does in a real app.
 *
 * In a real app the reload's native phase (downloading a multi-MB dev bundle) takes ~1-2 s, long
 * enough for a Back press to destroy the Activity before the reload's lifecycle step runs. This
 * template's bundle downloads in ~0.3 s, which beats the ~0.9 s Activity teardown, so the race is
 * not reached without this delay.
 */
const BUNDLE_DELAY_MS = 1500;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    enhanceMiddleware: middleware => (req, res, next) => {
      if (req.url && req.url.includes('.bundle')) {
        setTimeout(() => middleware(req, res, next), BUNDLE_DELAY_MS);
      } else {
        middleware(req, res, next);
      }
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
