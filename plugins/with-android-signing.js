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
      const appDir = path.join(projectRoot, 'android', 'app');
      const buildGradle = path.join(appDir, 'build.gradle');
      const signingGradle = path.join(appDir, 'with-signing.gradle');

      // Read key.properties if it exists
      const keyPropertiesPath = path.join(projectRoot, 'key.properties');
      let keyProps = {};

      if (fs.existsSync(keyPropertiesPath)) {
        const keyPropertiesContent = fs.readFileSync(keyPropertiesPath, 'utf8');
        keyPropertiesContent.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            keyProps[key.trim()] = value.trim();
          }
        });
      }

      // Determine values (Env vars take precedence, then key.properties)
      const storeFile = process.env.MYAPP_UPLOAD_STORE_FILE || (keyProps.storeFile ? path.join(projectRoot, keyProps.storeFile) : null);
      const storePassword = process.env.MYAPP_UPLOAD_STORE_PASSWORD || keyProps.storePassword;
      const keyAlias = process.env.MYAPP_UPLOAD_KEY_ALIAS || keyProps.keyAlias;
      const keyPassword = process.env.MYAPP_UPLOAD_KEY_PASSWORD || keyProps.keyPassword;

      // Escape backslashes for Gradle string
      const escapedStoreFile = storeFile ? storeFile.replace(/\\/g, '\\\\') : '';

      // Create signing gradle that extends signingConfigs during android block
      const signingContent = `// Auto-applied by with-android-signing config plugin
android {
    signingConfigs {
        release {
            def storeFilePath = "${escapedStoreFile}"
            def storePwd = "${storePassword || ''}"
            def kAlias = "${keyAlias || ''}"
            def kPwd = "${keyPassword || ''}"
            
            if (storeFilePath && storePwd && kAlias && kPwd) {
                def keystoreFile = file(storeFilePath)
                println "Keystore file path: \${storeFilePath}"
                
                if (keystoreFile.exists()) {
                    storeFile keystoreFile
                    storePassword storePwd
                    keyAlias kAlias
                    keyPassword kPwd
                    println "Release signing config configured successfully"
                } else {
                    println "Keystore file not found: \${storeFilePath}"
                }
            } else {
                println "Missing signing configuration. Please ensure key.properties exists or env vars are set."
            }
        }
    }
}

// Use afterEvaluate to forcefully override the release signing config
afterEvaluate {
    def releaseSigningConfig = android.signingConfigs.release
    println "🔧 Final signing config check:"
    println "  Release signingConfig storeFile: \${releaseSigningConfig.storeFile}"
    println "  Current release buildType signingConfig: \${android.buildTypes.release.signingConfig?.name}"
    
    if (releaseSigningConfig.storeFile && releaseSigningConfig.storeFile.exists()) {
        // Force override the signing config
        android.buildTypes.release.signingConfig = releaseSigningConfig
        println "✅ Applied release signing config: \${releaseSigningConfig.storeFile.absolutePath}"
        println "  Final release buildType signingConfig: \${android.buildTypes.release.signingConfig?.name}"
    } else {
        println "❌ Release signing config not applied, using debug keystore"
        if (releaseSigningConfig.storeFile) {
            println "   Keystore file does not exist: \${releaseSigningConfig.storeFile.absolutePath}"
        } else {
            println "   No keystore file configured"
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
