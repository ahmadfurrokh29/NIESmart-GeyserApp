/**
 * Expo config plugin for react-native-background-actions (used by the local
 * scheduler, see services/localScheduler.ts).
 *
 * Android 14+ requires every foreground service to declare its type in
 * AndroidManifest.xml. We use "specialUse" (keeping a user's water-heater
 * schedules running), because Android 15 limits "dataSync" services to
 * 6 hours a day. On Android 13 and older the type is simply ignored.
 *
 * Only affects our own APK builds (EAS / prebuild), not Expo Go.
 */
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const SERVICE = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';

module.exports = function withBackgroundActions(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.service = (app.service || []).filter((s) => s.$['android:name'] !== SERVICE);
    app.service.push({
      $: {
        'android:name': SERVICE,
        'android:exported': 'false',
        'android:foregroundServiceType': 'specialUse',
      },
      property: [
        {
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': 'Runs the user\'s water-heater schedules on time',
          },
        },
      ],
    });
    return cfg;
  });
};
