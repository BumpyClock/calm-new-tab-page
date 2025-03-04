const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Clean previous builds
console.log('Cleaning previous builds...');
const distDir = path.join(__dirname, '../dist');
const outputDir = path.join(__dirname, '../extension');

if (fs.existsSync(distDir)) {
  fs.removeSync(distDir);
}
if (fs.existsSync(outputDir)) {
  fs.removeSync(outputDir);
}

// Build the Next.js app with ESLint disabled
console.log('Building Next.js app...');
execSync('next build --no-lint', { stdio: 'inherit' });

// Define directories
const publicDir = path.join(__dirname, '../public');

// Create extension directory if it doesn't exist
fs.ensureDirSync(outputDir);

// Copy the static export to the extension directory, excluding problematic files
console.log('Copying files to extension directory...');

// Custom copy function to exclude files starting with "*" or other problematic patterns
const copyWithExclusions = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.warn(`Source path doesn't exist: ${src}`);
    return;
  }

  // Check if this is a file that should be excluded
  const baseName = path.basename(src);
  if (baseName.startsWith('*') || baseName.startsWith('.') || baseName === 'next') {
    console.log(`Skipping file/directory with reserved name: ${baseName}`);
    return;
  }

  // Handle directories
  if (fs.statSync(src).isDirectory()) {
    fs.ensureDirSync(dest);
    const entries = fs.readdirSync(src);
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyWithExclusions(srcPath, destPath);
    }
  } 
  // Handle files
  else {
    fs.copySync(src, dest);
  }
};

// Use our custom copy function
copyWithExclusions(distDir, outputDir);

// Copy manifest.json and background.js from public to extension directory
fs.copySync(path.join(publicDir, 'manifest.json'), path.join(outputDir, 'manifest.json'));
fs.copySync(path.join(publicDir, 'background.js'), path.join(outputDir, 'background.js'));

// Create icons directory if it doesn't exist
fs.ensureDirSync(path.join(outputDir, 'icons'));

// Copy icons from public/icons to extension/icons
if (fs.existsSync(path.join(publicDir, 'icons'))) {
  copyWithExclusions(path.join(publicDir, 'icons'), path.join(outputDir, 'icons'));
} else {
  console.warn('Icons directory not found in public folder');
}

// Ensure the manifest.json exists
if (!fs.existsSync(path.join(outputDir, 'manifest.json'))) {
  console.error('manifest.json was not copied to the extension directory');
  process.exit(1);
}

// Create custom extension HTML files if needed
if (!fs.existsSync(path.join(outputDir, 'index.html'))) {
  console.log('index.html not found. Creating newtab.html directly...');
  
  // Create a simple HTML file that redirects to the root
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Calm New Tab</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="./index.css">
  <script>
    // Remove the base path that Next.js might add
    document.addEventListener('DOMContentLoaded', function() {
      const baseElements = document.getElementsByTagName('base');
      for (let i = 0; i < baseElements.length; i++) {
        baseElements[i].remove();
      }
    });
  </script>
</head>
<body>
  <div id="__next"></div>
  <script src="./index.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'newtab.html'), htmlContent);
} else {
  console.log('Renaming index.html to newtab.html...');
  fs.copySync(path.join(outputDir, 'index.html'), path.join(outputDir, 'newtab.html'));
}

// Make sure settings page exists
if (!fs.existsSync(path.join(outputDir, 'settings.html')) && 
    !fs.existsSync(path.join(outputDir, 'settings/index.html'))) {
  console.log('Creating settings.html...');
  
  fs.ensureDirSync(path.join(outputDir, 'settings'));
  fs.copySync(path.join(outputDir, 'index.html'), path.join(outputDir, 'settings/index.html'));
}

// Update manifest.json to point to the correct files
console.log('Updating manifest.json...');
const manifest = fs.readJsonSync(path.join(outputDir, 'manifest.json'));
manifest.chrome_url_overrides = manifest.chrome_url_overrides || {};
manifest.chrome_url_overrides.newtab = 'newtab.html';
manifest.options_page = 'settings/index.html';
fs.writeJsonSync(path.join(outputDir, 'manifest.json'), manifest, { spaces: 2 });

console.log('Build complete! Extension files are in the "extension" directory');