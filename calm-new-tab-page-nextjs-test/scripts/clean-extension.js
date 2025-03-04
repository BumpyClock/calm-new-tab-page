const fs = require('fs-extra');
const path = require('path');

// Define directories to clean
const distDir = path.join(__dirname, '../dist');
const extensionDir = path.join(__dirname, '../extension');

console.log('Cleaning build directories...');

// Remove dist and extension directories
if (fs.existsSync(distDir)) {
  console.log(`Removing dist directory: ${distDir}`);
  fs.removeSync(distDir);
}

if (fs.existsSync(extensionDir)) {
  console.log(`Removing extension directory: ${extensionDir}`);
  fs.removeSync(extensionDir);
}

console.log('Clean complete!');