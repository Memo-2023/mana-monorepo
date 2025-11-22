const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to add foreground service type for microphone to Android manifest
 * This is required for Android 10+ to properly maintain audio recording when device is locked
 */
module.exports = function withAndroidForegroundService(config) {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults;
    
    // Add the foreground service type to the manifest
    const application = androidManifest.manifest.application[0];
    
    // Check if service declarations exist, if not create them
    if (!application.service) {
      application.service = [];
    }
    
    // Check if Notifee's foreground service already exists
    const notifeeService = application.service.find(
      service => service.$['android:name'] === 'app.notifee.core.ForegroundService'
    );
    
    if (!notifeeService) {
      // Add the Notifee foreground service with microphone type
      application.service.push({
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
          'android:foregroundServiceType': 'microphone',
          'android:exported': 'false'
        }
      });
      console.log('✅ Added foreground service declaration with microphone type to Android manifest');
    } else {
      // Update existing service to include microphone type
      notifeeService.$['android:foregroundServiceType'] = 'microphone';
      notifeeService.$['android:exported'] = 'false';
      console.log('✅ Updated existing foreground service with microphone type in Android manifest');
    }
    
    // Also ensure the FOREGROUND_SERVICE_MICROPHONE permission is present
    const permissions = androidManifest.manifest['uses-permission'] || [];
    const hasMicrophoneServicePermission = permissions.some(
      perm => perm.$['android:name'] === 'android.permission.FOREGROUND_SERVICE_MICROPHONE'
    );
    
    if (!hasMicrophoneServicePermission) {
      if (!androidManifest.manifest['uses-permission']) {
        androidManifest.manifest['uses-permission'] = [];
      }
      androidManifest.manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.FOREGROUND_SERVICE_MICROPHONE'
        }
      });
      console.log('✅ Added FOREGROUND_SERVICE_MICROPHONE permission to Android manifest');
    }
    
    return config;
  });
};