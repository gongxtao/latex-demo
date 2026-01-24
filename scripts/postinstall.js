#!/usr/bin/env node

/**
 * Post-install script to handle:
 * 1. Puppeteer Chrome installation (skip in CI environments)
 * 2. Platform-specific dependency cleanup for cross-platform builds
 */

const fs = require('fs');
const path = require('path');

const isCI = process.env.CI === 'true' ||
             process.env.VERCEL === '1' ||
             process.env.NETLIFY === '1' ||
             process.env.GITHUB_ACTIONS === '1' ||
             process.env.NODE_ENV === 'production';

// Skip Puppeteer installation in CI environments
if (!isCI) {
  console.log('Installing Puppeteer Chrome browser...');
  const { execSync } = require('child_process');
  try {
    execSync('npx puppeteer browsers install chrome', {
      stdio: 'inherit',
      env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'false' }
    });
    console.log('✓ Puppeteer Chrome installed successfully');
  } catch (error) {
    console.warn('⚠ Failed to install Puppeteer Chrome:', error.message);
  }
} else {
  console.log('Skipping Puppeteer Chrome installation in CI environment');
}

/**
 * Clean up platform-specific dependencies from package-lock.json
 * This is needed for Vercel builds which run on Linux
 */
function cleanupPlatformDeps() {
  const lockfilePath = path.join(process.cwd(), 'package-lock.json');

  if (!fs.existsSync(lockfilePath)) {
    console.log('No package-lock.json found, skipping cleanup');
    return;
  }

  console.log('Cleaning up platform-specific dependencies...');

  try {
    const lockfileContent = fs.readFileSync(lockfilePath, 'utf8');
    const lockfile = JSON.parse(lockfileContent);

    let modified = false;
    let removedCount = 0;

    // Check if packages node exists
    if (lockfile.packages) {
      // Find all @next/swc- packages to remove
      const packagesToRemove = [];

      // Iterate through all packages
      for (const key in lockfile.packages) {
        if (key.includes('node_modules/@next/swc-')) {
          // On Linux (Vercel), remove darwin and win32 packages
          if (key.includes('darwin') || key.includes('win32')) {
            packagesToRemove.push(key);
          }
        }
      }

      // Remove the packages
      for (const pkg of packagesToRemove) {
        delete lockfile.packages[pkg];
        removedCount++;
        modified = true;
      }

      // Clean up references in ALL packages' optionalDependencies
      for (const pkgKey in lockfile.packages) {
        const pkg = lockfile.packages[pkgKey];
        if (pkg.optionalDependencies) {
          for (const depName of Object.keys(pkg.optionalDependencies)) {
            if (depName.includes('@next/swc-') && (depName.includes('darwin') || depName.includes('win32'))) {
              delete pkg.optionalDependencies[depName];
              modified = true;
            }
          }
        }
        // Also clean up regular dependencies
        if (pkg.dependencies) {
          for (const depName of Object.keys(pkg.dependencies)) {
            if (depName.includes('@next/swc-') && (depName.includes('darwin') || depName.includes('win32'))) {
              delete pkg.dependencies[depName];
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(lockfilePath, JSON.stringify(lockfile, null, 2) + '\n');
      console.log(`✓ Removed ${removedCount} platform-specific package(s) from package-lock.json`);
      console.log('  Removed packages: darwin-x64, darwin-arm64, win32-*');
    } else {
      console.log('✓ No platform-specific cleanup needed');
    }
  } catch (error) {
    console.warn('⚠ Failed to cleanup platform dependencies:', error.message);
    // Don't fail the build if cleanup fails
  }
}

// Always cleanup in CI/build environments
// Also cleanup locally if NEXT_PLATFORM_CLEANUP env var is set
if (isCI || process.env.NEXT_PLATFORM_CLEANUP === '1') {
  cleanupPlatformDeps();
}
