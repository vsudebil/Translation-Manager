#!/usr/bin/env node

import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🚀 Building for root deployment...');

try {
  // Build the project using Vite
  console.log('📦 Building project with Vite...');
  execSync('npm run build', { 
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  // Copy built files from dist/public to root
  const distDir = resolve(projectRoot, 'dist/public');
  if (existsSync(distDir)) {
    console.log('📁 Copying built files to root directory...');
    
    // List files in dist/public and copy them to root
    const files = readdirSync(distDir);
    for (const file of files) {
      const srcPath = resolve(distDir, file);
      const destPath = resolve(projectRoot, file);
      
      // Remove existing file/directory if it exists
      if (existsSync(destPath)) {
        rmSync(destPath, { recursive: true, force: true });
      }
      
      cpSync(srcPath, destPath, { recursive: true });
      console.log(`✅ Copied ${file} to root`);
    }
    
    console.log('🎉 Root build complete!');
    console.log('📂 Files are now in the root directory for GitHub Pages');

  } else {
    throw new Error('Build directory not found. Make sure the build completed successfully.');
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}