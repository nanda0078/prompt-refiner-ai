const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const javaHome = process.env.JAVA_HOME || 'C:\\Users\\Seven Studio PC\\AppData\\Local\\Programs\\jdk-17\\jdk-17.0.12+7';
const androidHome = process.env.ANDROID_HOME || 'C:\\Users\\Seven Studio PC\\AppData\\Local\\Android\\Sdk';

console.log('========================================');
console.log('   PROMPT REFINER AI - APK BUILDER     ');
console.log('========================================');
console.log('[APK Build] JAVA_HOME   :', javaHome);
console.log('[APK Build] ANDROID_HOME:', androidHome);

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidHome,
  PATH: `${path.join(javaHome, 'bin')};${process.env.PATH}`,
};

const rootDir = path.resolve('.');
const androidDir = path.join(rootDir, 'android');
const gradlew = path.join(androidDir, 'gradlew.bat');

try {
  console.log('\n[1/4] Building web assets...');
  execSync('npm.cmd run build', { cwd: rootDir, env, stdio: 'inherit' });

  console.log('\n[2/4] Syncing web assets to Capacitor Android...');
  execSync('npx.cmd cap sync android', { cwd: rootDir, env, stdio: 'inherit' });

  console.log('\n[3/4] Stopping stale Gradle daemons...');
  try {
    execSync(`"${gradlew}" --stop`, { cwd: androidDir, env, stdio: 'inherit' });
  } catch {}

  console.log('\n[4/4] Compiling Android Release APK via Gradle...');
  execSync(`"${gradlew}" assembleRelease --no-daemon`, {
    cwd: androidDir,
    env,
    stdio: 'inherit',
  });

  const tempBuildDir = 'C:\\Users\\Seven Studio PC\\AppData\\Local\\Temp\\prompt_refiner_build';
  const searchCandidates = [
    path.join(tempBuildDir, 'app', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(tempBuildDir, 'app', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
    path.join(tempBuildDir, 'app', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
    path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  ];

  let apkPath = searchCandidates.find((p) => fs.existsSync(p));

  if (!apkPath) {
    console.warn('[APK Build] Release APK not found directly, falling back to assembleDebug...');
    execSync(`"${gradlew}" assembleDebug --no-daemon`, {
      cwd: androidDir,
      env,
      stdio: 'inherit',
    });
    apkPath = searchCandidates.find((p) => fs.existsSync(p));
  }

  if (apkPath) {
    const stats = fs.statSync(apkPath);
    const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`\n========================================`);
    console.log(`[APK Build] SUCCESS!`);
    console.log(`[APK Build] APK Path: ${apkPath}`);
    console.log(`[APK Build] File Size: ${sizeMb} MB`);
    console.log(`========================================\n`);

    // Target destinations
    const apkFileName = 'prompt-refiner-ai.apk';
    const publicApkDir = path.join(rootDir, 'public', 'apk');
    const distApkDir = path.join(rootDir, 'dist', 'apk');
    const releaseOutputDir = path.join(rootDir, 'release-apk');

    [publicApkDir, distApkDir, releaseOutputDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const targetPublic = path.join(publicApkDir, apkFileName);
    const targetDist = path.join(distApkDir, apkFileName);
    const targetRelease = path.join(releaseOutputDir, apkFileName);

    fs.copyFileSync(apkPath, targetPublic);
    fs.copyFileSync(apkPath, targetDist);
    fs.copyFileSync(apkPath, targetRelease);

    const info = {
      available: true,
      appName: 'PROMPT REFINER AI',
      fileName: apkFileName,
      version: '1.0.0',
      fileSizeBytes: stats.size,
      fileSizeFormatted: `${sizeMb} MB`,
      builtAt: new Date().toISOString(),
      rawPath: apkPath,
      downloadPath: `./apk/${apkFileName}`,
    };

    fs.writeFileSync(path.join(publicApkDir, 'info.json'), JSON.stringify(info, null, 2));
    fs.writeFileSync(path.join(distApkDir, 'info.json'), JSON.stringify(info, null, 2));
    fs.writeFileSync(path.join(releaseOutputDir, 'info.json'), JSON.stringify(info, null, 2));

    console.log(`[APK Build] Copied APK to:`);
    console.log(` - ${targetPublic}`);
    console.log(` - ${targetDist}`);
    console.log(` - ${targetRelease}`);
    console.log('[APK Build] Metadata generated in info.json successfully.');
  } else {
    console.error('[APK Build] ERROR: No APK output found!');
    process.exit(1);
  }
} catch (err) {
  console.error('[APK Build] Gradle build failed:', err.message);
  process.exit(1);
}
