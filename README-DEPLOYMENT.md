# GitHub Pages Deployment Guide

This project is configured to deploy to GitHub Pages. There are two ways to build and deploy:

## Automatic Deployment (Recommended)

1. **Push to main branch**: The GitHub Actions workflow will automatically build and deploy your changes.
2. **Check deployment**: Visit your GitHub Pages URL to see the live site.

## Manual Deployment

If you want to build and commit the files manually:

1. **Run the build script**:
   ```bash
   chmod +x build-for-github-pages.sh
   ./build-for-github-pages.sh
   ```

2. **Commit the built files**:
   ```bash
   git add index.html assets/
   git commit -m "Deploy: Update GitHub Pages build"
   git push
   ```

## Project Structure

- `client/` - React frontend source code
- `shared/` - TypeScript interfaces and types
- `scripts/` - Build scripts for GitHub Pages
- `.github/workflows/` - GitHub Actions for automatic deployment

## Configuration

- **Homepage URL**: Set in `package.json` homepage field
- **Base Path**: Configured for GitHub Pages in `vite.config.ts`
- **Build Output**: Goes to `gh-pages/` folder for Actions, or root for manual builds

## Troubleshooting

- If the site doesn't load properly, check that the base path matches your repository name
- Ensure GitHub Pages is enabled in your repository settings
- Check the Actions tab for deployment status