#!/usr/bin/env node

import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🚀 Building for GitHub Pages...');

// Clean up any existing gh-pages directory
const ghPagesDir = resolve(projectRoot, 'gh-pages');
if (existsSync(ghPagesDir)) {
  rmSync(ghPagesDir, { recursive: true, force: true });
}

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

  // Create gh-pages directory
  mkdirSync(ghPagesDir, { recursive: true });

  // Copy built files from dist/public to gh-pages
  const distDir = resolve(projectRoot, 'dist/public');
  if (existsSync(distDir)) {
    console.log('📁 Copying built files to gh-pages directory...');
    cpSync(distDir, ghPagesDir, { recursive: true });
    console.log('✅ Files copied successfully!');
  } else {
    throw new Error('Build directory not found. Make sure the build completed successfully.');
  }

  console.log('🎉 GitHub Pages build complete!');
  console.log(`📂 Files are ready in: ${ghPagesDir}`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}