const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve('.');
const distDir = path.join(rootDir, 'dist');
const backupDir = 'C:\\Users\\Seven Studio PC\\AppData\\Local\\Temp\\prompt_refiner_gh_dist';

console.log('========================================');
console.log('   PROMPT REFINER AI - DEPLOY GH-PAGES ');
console.log('========================================');

// 1. Build dist
console.log('\n[1/5] Building distribution assets...');
execSync('npm.cmd run build', { cwd: rootDir, stdio: 'inherit' });

// Ensure 404.html and .nojekyll exist
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

// Ensure APK is included in dist/apk
const publicApkDir = path.join(rootDir, 'public', 'apk');
const distApkDir = path.join(distDir, 'apk');
if (fs.existsSync(publicApkDir)) {
  if (!fs.existsSync(distApkDir)) fs.mkdirSync(distApkDir, { recursive: true });
  fs.cpSync(publicApkDir, distApkDir, { recursive: true });
  console.log('[Deploy] Synced APK artifacts into dist/apk/');
}

// 2. Backup dist
console.log('\n[2/5] Backing up dist to temporary directory:', backupDir);
if (fs.existsSync(backupDir)) {
  fs.rmSync(backupDir, { recursive: true, force: true });
}
fs.cpSync(distDir, backupDir, { recursive: true });

// 3. Switch to or create gh-pages branch
console.log('\n[3/5] Switching to branch gh-pages...');
try {
  execSync('git checkout gh-pages', { cwd: rootDir, stdio: 'inherit' });
} catch {
  console.log('[Deploy] Branch gh-pages not found, creating orphan branch...');
  execSync('git checkout --orphan gh-pages', { cwd: rootDir, stdio: 'inherit' });
  execSync('git rm -rf .', { cwd: rootDir, stdio: 'inherit' });
}

// 4. Copy files from backup to root of gh-pages
console.log('\n[4/5] Copying web assets to gh-pages branch...');
fs.cpSync(backupDir, rootDir, { recursive: true });

// 5. Stage, commit, and push
console.log('\n[5/5] Committing and pushing to origin gh-pages...');
execSync('git add -A', { cwd: rootDir, stdio: 'inherit' });

try {
  execSync('git commit -m "deploy: publish PROMPT REFINER AI final release to GitHub Pages"', {
    cwd: rootDir,
    stdio: 'inherit',
  });
} catch (e) {
  console.log('[Deploy] No new changes to commit on gh-pages.');
}

try {
  execSync('git push -u origin gh-pages --force', { cwd: rootDir, stdio: 'inherit' });
  console.log('\n========================================');
  console.log('[Deploy] GitHub Pages PUSH SUCCESSFUL!');
  console.log('========================================\n');
} catch (err) {
  console.warn('[Deploy] Push to remote origin gh-pages failed or remote not configured yet:', err.message);
} finally {
  console.log('[Deploy] Switching back to branch main...');
  execSync('git checkout main', { cwd: rootDir, stdio: 'inherit' });
}
