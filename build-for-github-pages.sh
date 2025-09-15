#!/bin/bash

echo "🚀 Building Translation Manager for GitHub Pages..."

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Build the project
echo "📦 Building with Vite..."
npm run build

# Run the GitHub Pages build script
echo "📁 Preparing files for GitHub Pages..."
node scripts/build-root.js

echo "✅ Build complete! Files are now in the root directory."
echo "💡 You can now commit the index.html and assets/ folder to deploy to GitHub Pages."