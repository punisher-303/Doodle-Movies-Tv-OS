const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

/**
 * Adds release signing configuration that reads from env vars after prebuild.
 * Uses a Gradle file that applies signing config during the android block evaluation.
 */
module.exports = function withAndroidSigning(config) {
  return withDangerousMod(config, [
    'android',
    async cfg => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, 'android');
      const appDir = path.join(androidDir, 'app');
      const buildGradle = path.join(appDir, 'build.gradle');
      const signingGradle = path.join(appDir, 'with-signing.gradle');

      // Copy key.properties and Doodle.jks to android/ directory
      // This ensures rootProject.file('Doodle.jks') works as expected in Gradle
      const keyPropsSource = path.join(projectRoot, 'key.properties');
      const keystoreSource = path.join(projectRoot, 'Doodle.jks');

      if (fs.existsSync(keyPropsSource)) {
        fs.copyFileSync(keyPropsSource, path.join(androidDir, 'key.properties'));
      }
      if (fs.existsSync(keystoreSource)) {
        fs.copyFileSync(keystoreSource, path.join(androidDir, 'Doodle.jks'));
      }

      // Exact Groovy logic from the source app
      const signingContent = `// Auto-applied by with-android-signing config plugin
android {
    signingConfigs {
        def keystoreProperties = new Properties()
        def keystorePropertiesFile = rootProject.file('key.properties')
        if (keystorePropertiesFile.exists()) {
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
            release {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile rootProject.file('Doodle.jks')
                storePassword keystoreProperties['storePassword']
                v1SigningEnabled true
                v2SigningEnabled true
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        release {
            def keystorePropertiesFile = rootProject.file('key.properties')
            if (keystorePropertiesFile.exists()) {
                println("keystorePropertiesFile exists")
                signingConfig signingConfigs.release
            } else {
                println("keystorePropertiesFile does not exist")
                signingConfig signingConfigs.debug
            }
        }
    }
}
`;
      fs.writeFileSync(signingGradle, signingContent, 'utf8');

      // Idempotently add apply from with-signing.gradle
      let gradleText = fs.readFileSync(buildGradle, 'utf8');
      if (!gradleText.includes("apply from: 'with-signing.gradle'")) {
        // Find the last apply from line and add our line after it
        const applyFromLines = gradleText.match(/apply from: '[^']+'/g);
        if (applyFromLines && applyFromLines.length > 0) {
          const lastApplyFrom = applyFromLines[applyFromLines.length - 1];
          gradleText = gradleText.replace(
            lastApplyFrom,
            `${lastApplyFrom}\napply from: 'with-signing.gradle'`,
          );
        } else {
          // If no apply from lines found, add after React plugin
          gradleText = gradleText.replace(
            /apply plugin: "com\.facebook\.react"/,
            `apply plugin: "com.facebook.react"\napply from: 'with-signing.gradle'`,
          );
        }
        fs.writeFileSync(buildGradle, gradleText, 'utf8');
      }

      return cfg;
    },
  ]);
};
