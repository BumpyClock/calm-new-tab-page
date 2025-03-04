const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Project paths
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const outputDir = path.join(projectRoot, 'extension');
const publicDir = path.join(projectRoot, 'public');
const nextConfigPath = path.join(projectRoot, 'next.config.js');

// Step 1: Create a temporary Next.js config optimized for extension building
function createNextConfig() {
  console.log('Setting up Next.js config for extension build...');
  
  // Backup existing config if it exists
  if (fs.existsSync(nextConfigPath)) {
    fs.copySync(nextConfigPath, `${nextConfigPath}.backup`);
  }
  
  // Create new config
  const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable static exports
  output: 'export',
  
  // Set the dist directory for output
  distDir: 'dist',
  
  // Disable image optimization for extension compatibility
  images: {
    unoptimized: true,
  },
  
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,
  
  // For next/font compatibility, we use a proper URL
  // This will be fixed in the extension at runtime
  assetPrefix: '/',
  
  // Treat specific environment variables as public
  env: {
    NEXT_PUBLIC_APP_ENV: 'extension',
  },
};

module.exports = nextConfig;`;

  fs.writeFileSync(nextConfigPath, configContent);
}

// Step 2: Clean previous builds
function cleanPreviousBuilds() {
  console.log('Cleaning previous builds...');
  
  if (fs.existsSync(distDir)) {
    fs.removeSync(distDir);
  }
  
  if (fs.existsSync(outputDir)) {
    fs.removeSync(outputDir);
  }
}

// Step 3: Build Next.js app
function buildNextApp() {
  console.log('Building Next.js app...');
  try {
    execSync('next build --no-lint', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Failed to build Next.js app:', error.message);
    return false;
  }
}

// Step 4: Copy files to extension directory excluding problematic ones
function copyFilesToExtension() {
  console.log('Copying files to extension directory...');
  
  fs.ensureDirSync(outputDir);
  
  // First, copy everything except _next directory
  const entriesToCopy = fs.readdirSync(distDir).filter(entry => entry !== '_next');
  
  for (const entry of entriesToCopy) {
    const srcPath = path.join(distDir, entry);
    const destPath = path.join(outputDir, entry);
    fs.copySync(srcPath, destPath);
  }
  
  // Now handle the _next directory specially - rename it to 'assets'
  console.log('Renaming _next directory to assets...');
  const nextDirSrc = path.join(distDir, '_next');
  const nextDirDest = path.join(outputDir, 'assets');
  
  if (fs.existsSync(nextDirSrc)) {
    fs.copySync(nextDirSrc, nextDirDest);
  } else {
    console.warn('_next directory not found in build output');
  }
}

// Step 5: Update references to _next in HTML files
function updateNextReferences() {
  console.log('Updating references to _next in HTML files...');
  
  // Find all HTML files in the extension directory
  const htmlFiles = findAllHtmlFiles(outputDir);
  
  for (const htmlFile of htmlFiles) {
    console.log(`Updating references in ${path.relative(outputDir, htmlFile)}`);
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // Replace all references to /_next/ with /assets/
    content = content.replace(/\/_next\//g, '/assets/');
    
    fs.writeFileSync(htmlFile, content);
  }
}

// Helper function to find all HTML files
function findAllHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findAllHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Step 6: Reorganize extension directory structure
function organizeExtensionStructure() {
  console.log('Organizing extension directory structure...');
  
  // Create settings directory
  fs.ensureDirSync(path.join(outputDir, 'settings'));
  
  // If there's a settings directory already built by Next.js
  if (fs.existsSync(path.join(outputDir, 'settings.html'))) {
    // Move settings.html to settings/index.html
    fs.copySync(path.join(outputDir, 'settings.html'), path.join(outputDir, 'settings/index.html'));
    fs.removeSync(path.join(outputDir, 'settings.html'));
  } else if (fs.existsSync(path.join(outputDir, 'settings/index.html'))) {
    // It's already in the right place
    console.log('Settings page already in the correct location');
  } else {
    // Need to create a settings page
    console.log('Creating settings page from index.html');
    
    // Copy index.html to settings/index.html
    if (fs.existsSync(path.join(outputDir, 'index.html'))) {
      let settingsContent = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
      
      // Update paths to be relative to settings directory
      settingsContent = settingsContent.replace(/src="\/assets\//g, 'src="../assets/');
      settingsContent = settingsContent.replace(/href="\/assets\//g, 'href="../assets/');
      
      // Add the extension loader script
      settingsContent = settingsContent.replace('</head>', '<script src="../extension-loader.js"></script></head>');
      
      fs.writeFileSync(path.join(outputDir, 'settings/index.html'), settingsContent);
    } else {
      // Create a minimal settings page
      createMinimalSettingsPage();
    }
  }
  
  // Create welcome.html
  createWelcomePage();
  
  // Create newtab.html from index.html if it doesn't exist
  if (!fs.existsSync(path.join(outputDir, 'newtab.html')) && fs.existsSync(path.join(outputDir, 'index.html'))) {
    let newtabContent = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
    
    // Add extension loader script
    newtabContent = newtabContent.replace('</head>', '<script src="./extension-loader.js"></script></head>');
    
    fs.writeFileSync(path.join(outputDir, 'newtab.html'), newtabContent);
  } else if (!fs.existsSync(path.join(outputDir, 'newtab.html'))) {
    // Create minimal newtab page
    createMinimalNewtabPage();
  }
}

// Helper function to create a minimal settings page
function createMinimalSettingsPage() {
  console.log('Creating minimal settings page');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Calm New Tab - Settings</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="../extension-loader.js"></script>
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <div id="settings-container" class="container">
    <h1>Calm New Tab Settings</h1>
    
    <div class="settings-section">
      <h2>Feed Settings</h2>
      <div id="feed-settings">
        <p>Loading feed settings...</p>
      </div>
    </div>
    
    <div class="settings-section">
      <h2>Display Settings</h2>
      <div id="display-settings">
        <p>Loading display settings...</p>
      </div>
    </div>
    
    <button id="save-settings" class="btn primary">Save Settings</button>
    <button id="back-to-newtab" class="btn secondary">Back to New Tab</button>
  </div>

  <script src="../assets/settings.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'settings/index.html'), htmlContent);
}

// Helper function to create a minimal newtab page
function createMinimalNewtabPage() {
  console.log('Creating minimal newtab page');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Calm New Tab</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="./extension-loader.js"></script>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div id="app-container">
    <div id="header">
      <h1>Calm New Tab</h1>
    </div>
    
    <div id="content">
      <p>Loading your content...</p>
    </div>
    
    <div id="footer">
      <a href="./settings/index.html">Settings</a>
    </div>
  </div>

  <script src="./assets/main.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'newtab.html'), htmlContent);
}

// Helper function to create welcome page
function createWelcomePage() {
  console.log('Creating welcome page');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Calm New Tab</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="./extension-loader.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #4A7AFF;
    }
    h2 {
      font-size: 1.8rem;
      margin-top: 2rem;
      color: #2D5BD7;
    }
    .feature {
      background: #f7f9ff;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .feature h3 {
      margin-top: 0;
      color: #2D5BD7;
    }
    .cta {
      background: #4A7AFF;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 1rem;
      border-radius: 4px;
      cursor: pointer;
      display: inline-block;
      text-decoration: none;
      margin-top: 20px;
    }
    .cta:hover {
      background: #2D5BD7;
    }
  </style>
</head>
<body>
  <h1>Welcome to Calm New Tab</h1>
  
  <p>Thank you for installing Calm New Tab! This extension replaces your new tab page with a clean, distraction-free experience focused on what matters most to you.</p>
  
  <h2>Features</h2>
  
  <div class="feature">
    <h3>RSS Feed Integration</h3>
    <p>Stay updated with your favorite websites using our integrated RSS reader. Add any RSS feed to customize your reading experience.</p>
  </div>
  
  <div class="feature">
    <h3>Beautiful Backgrounds</h3>
    <p>Each new tab comes with a stunning daily background image to inspire you.</p>
  </div>
  
  <div class="feature">
    <h3>Quick Access</h3>
    <p>Easily access your most visited sites without cluttering your view.</p>
  </div>
  
  <div class="feature">
    <h3>Customizable</h3>
    <p>Configure your new tab experience just the way you like it through the settings page.</p>
  </div>
  
  <h2>Getting Started</h2>
  
  <p>Your new tab page is ready to use! To customize your experience:</p>
  
  <ol>
    <li>Open a new tab to see Calm New Tab in action</li>
    <li>Click the settings icon in the top right corner</li>
    <li>Add your favorite RSS feeds</li>
    <li>Configure display preferences</li>
  </ol>
  
  <a href="newtab.html" class="cta">Open New Tab</a>
  <a href="settings/index.html" class="cta" style="margin-left: 10px;">Go to Settings</a>
  
  <p style="margin-top: 40px; font-size: 0.9rem; color: #666;">Calm New Tab respects your privacy. We don't collect any personal data or browsing history.</p>
</body>
</html>`;
  
  fs.writeFileSync(path.join(outputDir, 'welcome.html'), htmlContent);
}

// Step 7: Add extension-specific files
function addExtensionFiles() {
  console.log('Adding extension-specific files...');
  
  // Copy manifest and background script
  fs.copySync(path.join(publicDir, 'manifest.json'), path.join(outputDir, 'manifest.json'));
  fs.copySync(path.join(publicDir, 'background.js'), path.join(outputDir, 'background.js'));
  
  // Create extension-loader.js in the extension directory
  // Note: This is a CLIENT-SIDE script that will run in the browser, not in Node.js
  const loaderContent = `// This script helps load Next.js app in Chrome extension context
(function() {
  // Fix paths in all resources
  function fixPaths() {
    // Remove any base elements
    const baseElements = document.getElementsByTagName('base');
    while (baseElements.length > 0) {
      baseElements[0].remove();
    }
    
    // Get current location to determine relative path prefix
    const isInSubfolder = window.location.pathname.includes('/settings/');
    const pathPrefix = isInSubfolder ? '../' : './';
    
    // Fix script src attributes - both /assets/ (our renamed _next) and other paths
    document.querySelectorAll('script[src]').forEach(script => {
      if (script.src.includes('/assets/')) {
        const newSrc = script.src.replace(/\\/assets\\//, pathPrefix + 'assets/');
        script.src = newSrc;
      } else if (script.src.startsWith('/')) {
        const newSrc = script.src.replace(/^\\//, pathPrefix);
        script.src = newSrc;
      }
    });
    
    // Fix link href attributes
    document.querySelectorAll('link[href]').forEach(link => {
      if (link.href.includes('/assets/')) {
        const newHref = link.href.replace(/\\/assets\\//, pathPrefix + 'assets/');
        link.href = newHref;
      } else if (link.href.startsWith(window.location.origin + '/')) {
        const newHref = link.href.replace(window.location.origin + '/', pathPrefix);
        link.href = newHref;
      }
    });
    
    // Fix image src attributes
    document.querySelectorAll('img[src]').forEach(img => {
      if (img.src.includes('/assets/')) {
        const newSrc = img.src.replace(/\\/assets\\//, pathPrefix + 'assets/');
        img.src = newSrc;
      } else if (img.src.startsWith('/')) {
        const newSrc = img.src.replace(/^\\//, pathPrefix);
        img.src = newSrc;
      }
    });
  }
  
  // Execute path fixing after DOM content is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixPaths);
  } else {
    fixPaths();
  }
  
  // Also monitor for dynamic changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        fixPaths();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();`;

  fs.writeFileSync(path.join(outputDir, 'extension-loader.js'), loaderContent);
  
  // Copy icons directory if it exists
  if (fs.existsSync(path.join(publicDir, 'icons'))) {
    fs.copySync(path.join(publicDir, 'icons'), path.join(outputDir, 'icons'));
  } else {
    console.warn('Icons directory not found in public folder');
  }
  
  // Copy any other static assets if needed
  if (fs.existsSync(path.join(publicDir, 'images'))) {
    fs.copySync(path.join(publicDir, 'images'), path.join(outputDir, 'images'));
  }
}

// Step 8: Update manifest.json
function updateManifest() {
  console.log('Updating manifest.json...');
  
  const manifestPath = path.join(outputDir, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('manifest.json not found in output directory');
    return false;
  }
  
  try {
    const manifest = fs.readJsonSync(manifestPath);
    
    if (!manifest.content_security_policy) {
        manifest.content_security_policy = {
          "extension_pages": "script-src 'self'; object-src 'self'"
        };
      }
    // Update chrome_url_overrides
    manifest.chrome_url_overrides = manifest.chrome_url_overrides || {};
    manifest.chrome_url_overrides.newtab = 'newtab.html';
    
    // Update options_page
    manifest.options_page = 'settings/index.html';
    //Add web_accessible_resources
    manifest.web_accessible_resources = manifest.web_accessible_resources || [{
        resources: ["assets/*", "images/*"],
        matches: ["<all_urls>"]
      }];

      if (manifest.manifest_version === 3 && manifest.background) {
        // Convert background.js to service worker if needed
        if (manifest.background.scripts) {
          manifest.background = {
            service_worker: "background.js"
          };
        }
      }
    // Write updated manifest
    fs.writeJsonSync(manifestPath, manifest, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Failed to update manifest.json:', error.message);
    return false;
  }
}

// Step 9: Restore original Next.js config
function restoreNextConfig() {
  console.log('Restoring original Next.js config...');
  
  if (fs.existsSync(`${nextConfigPath}.backup`)) {
    fs.copySync(`${nextConfigPath}.backup`, nextConfigPath);
    fs.removeSync(`${nextConfigPath}.backup`);
  }
}

// Main build function
async function buildExtension() {
  try {
    console.log('Starting extension build process...');
    
    cleanPreviousBuilds();
    createNextConfig();
    
    if (!buildNextApp()) {
      throw new Error('Next.js build failed');
    }
    
    copyFilesToExtension();
    updateNextReferences();
    organizeExtensionStructure();
    addExtensionFiles();
    
    if (!updateManifest()) {
      throw new Error('Failed to update manifest.json');
    }
    
    console.log('Extension build completed successfully!');
    console.log(`Extension files are in: ${outputDir}`);
  } catch (error) {
    console.error('Extension build failed:', error.message);
  } finally {
    restoreNextConfig();
  }
}

// Run the build process
buildExtension();