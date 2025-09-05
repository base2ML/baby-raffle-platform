#!/usr/bin/env node

/**
 * Tenant Site Builder
 * 
 * This script builds a customized tenant site from the template by:
 * 1. Cloning the template
 * 2. Injecting tenant-specific configuration
 * 3. Building the static site
 * 4. Preparing for deployment
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TenantSiteBuilder {
  constructor() {
    this.templateDir = path.join(__dirname, '..', 'tenant-site-template');
    this.buildDir = path.join(__dirname, '..', 'builds');
    this.deploymentDir = path.join(__dirname, '..', 'deployments');
  }

  /**
   * Build a tenant site with the provided configuration
   */
  async buildSite(tenantConfig, buildId) {
    console.log(`🏗️  Building tenant site for: ${tenantConfig.subdomain}`);
    console.log(`📝 Build ID: ${buildId}`);

    try {
      // Create build directory
      const siteBuildDir = path.join(this.buildDir, buildId);
      await fs.mkdir(siteBuildDir, { recursive: true });

      // Copy template to build directory
      console.log('📂 Copying template files...');
      await this.copyTemplate(siteBuildDir);

      // Inject tenant configuration
      console.log('⚙️  Injecting tenant configuration...');
      await this.injectTenantConfig(siteBuildDir, tenantConfig);

      // Install dependencies
      console.log('📦 Installing dependencies...');
      execSync('npm install', { 
        cwd: siteBuildDir, 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });

      // Build the site
      console.log('🔨 Building site...');
      execSync('npm run build', { 
        cwd: siteBuildDir, 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          NODE_ENV: 'production',
          VITE_TENANT_CONFIG: JSON.stringify(tenantConfig)
        }
      });

      // Prepare deployment package
      const deploymentPackage = await this.prepareDeploymentPackage(siteBuildDir, buildId, tenantConfig);

      console.log('✅ Site built successfully!');
      console.log(`📦 Deployment package: ${deploymentPackage.packagePath}`);

      return {
        success: true,
        buildId,
        buildPath: siteBuildDir,
        deploymentPackage
      };

    } catch (error) {
      console.error('❌ Build failed:', error.message);
      
      // Clean up failed build
      try {
        const siteBuildDir = path.join(this.buildDir, buildId);
        await fs.rm(siteBuildDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to clean up build directory:', cleanupError.message);
      }

      return {
        success: false,
        buildId,
        error: error.message
      };
    }
  }

  /**
   * Copy template directory to build location
   */
  async copyTemplate(targetDir) {
    const copyRecursive = async (src, dest) => {
      const stats = await fs.stat(src);
      
      if (stats.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src);
        
        for (const entry of entries) {
          // Skip node_modules and other build artifacts
          if (['node_modules', '.git', 'dist', '.cache'].includes(entry)) {
            continue;
          }
          
          await copyRecursive(
            path.join(src, entry), 
            path.join(dest, entry)
          );
        }
      } else {
        await fs.copyFile(src, dest);
      }
    };

    await copyRecursive(this.templateDir, targetDir);
  }

  /**
   * Inject tenant configuration into the build
   */
  async injectTenantConfig(buildDir, config) {
    // Create tenant-specific configuration files
    const configPath = path.join(buildDir, 'src', 'config', 'injected-config.ts');
    const configContent = `
// Auto-generated tenant configuration
// This file is created during the build process

export const TENANT_CONFIG = ${JSON.stringify(config, null, 2)};

// Make config globally available
declare global {
  interface Window {
    __TENANT_CONFIG__: typeof TENANT_CONFIG;
  }
}

window.__TENANT_CONFIG__ = TENANT_CONFIG;
`;

    await fs.writeFile(configPath, configContent);

    // Update the main config file to use injected config
    const mainConfigPath = path.join(buildDir, 'src', 'config', 'tenant-config.ts');
    let mainConfigContent = await fs.readFile(mainConfigPath, 'utf-8');
    
    // Add import for injected config
    mainConfigContent = `import { TENANT_CONFIG } from './injected-config';\n${mainConfigContent}`;
    
    // Replace the loadTenantConfig function
    mainConfigContent = mainConfigContent.replace(
      /const loadTenantConfig = \(\)[\s\S]*?};/,
      `const loadTenantConfig = (): TenantConfig => {
  return TENANT_CONFIG;
};`
    );

    await fs.writeFile(mainConfigPath, mainConfigContent);

    // Create environment file
    const envPath = path.join(buildDir, '.env.production');
    const envContent = `
VITE_API_BASE_URL=https://api.base2ml.com
VITE_TENANT_ID=${config.tenantId}
VITE_SUBDOMAIN=${config.subdomain}
`;
    
    await fs.writeFile(envPath, envContent);

    // Update index.html with tenant-specific meta tags
    const indexPath = path.join(buildDir, 'index.html');
    let indexContent = await fs.readFile(indexPath, 'utf-8');
    
    // Inject meta tags
    const metaTags = `
    <title>${config.siteSettings.title}</title>
    <meta name="description" content="${config.siteSettings.description}" />
    <meta property="og:title" content="${config.siteSettings.title}" />
    <meta property="og:description" content="${config.siteSettings.description}" />
    <meta name="theme-color" content="${config.siteSettings.theme.primaryColor}" />
  `;
    
    indexContent = indexContent.replace('<title>Vite + React + TS</title>', metaTags);
    
    await fs.writeFile(indexPath, indexContent);
  }

  /**
   * Prepare deployment package
   */
  async prepareDeploymentPackage(buildDir, buildId, config) {
    const deploymentDir = path.join(this.deploymentDir, buildId);
    await fs.mkdir(deploymentDir, { recursive: true });

    // Copy built files
    const distDir = path.join(buildDir, 'dist');
    const packageDistDir = path.join(deploymentDir, 'dist');
    
    await this.copyDirectory(distDir, packageDistDir);

    // Create deployment manifest
    const manifest = {
      buildId,
      tenantId: config.tenantId,
      subdomain: config.subdomain,
      builtAt: new Date().toISOString(),
      config: {
        title: config.siteSettings.title,
        description: config.siteSettings.description,
        parentInfo: config.parentInfo
      },
      files: await this.getFileList(packageDistDir)
    };

    const manifestPath = path.join(deploymentDir, 'deployment-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Create deployment script
    const deployScript = `#!/bin/bash
set -e

echo "🚀 Deploying ${config.subdomain}.base2ml.com"
echo "📦 Build ID: ${buildId}"

# Sync files to S3 (or other static hosting)
if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 sync ./dist s3://$AWS_S3_BUCKET/${config.subdomain}/ --delete
    echo "✅ Files synced to S3"
else
    echo "⚠️  AWS_S3_BUCKET not set, skipping S3 sync"
fi

# Invalidate CloudFront cache
if [ -n "$AWS_CLOUDFRONT_DISTRIBUTION" ]; then
    aws cloudfront create-invalidation \\
        --distribution-id $AWS_CLOUDFRONT_DISTRIBUTION \\
        --paths "/${config.subdomain}/*"
    echo "✅ CloudFront cache invalidated"
else
    echo "⚠️  AWS_CLOUDFRONT_DISTRIBUTION not set, skipping cache invalidation"
fi

echo "🎉 Deployment complete!"
echo "🌐 Site available at: https://${config.subdomain}.base2ml.com"
`;

    const deployScriptPath = path.join(deploymentDir, 'deploy.sh');
    await fs.writeFile(deployScriptPath, deployScript);
    await fs.chmod(deployScriptPath, '755');

    return {
      packagePath: deploymentDir,
      manifestPath,
      deployScriptPath,
      manifest
    };
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Get list of files in directory
   */
  async getFileList(dir, prefix = '') {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(prefix, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.getFileList(
          path.join(dir, entry.name), 
          relativePath
        );
        files.push(...subFiles);
      } else {
        const stats = await fs.stat(path.join(dir, entry.name));
        files.push({
          path: relativePath,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }

    return files;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const configFile = process.argv[2];
  const buildId = process.argv[3] || `build-${Date.now()}`;

  if (!configFile) {
    console.error('Usage: node build-tenant-site.js <config-file> [build-id]');
    process.exit(1);
  }

  try {
    const configContent = await fs.readFile(configFile, 'utf-8');
    const tenantConfig = JSON.parse(configContent);
    
    const builder = new TenantSiteBuilder();
    const result = await builder.buildSite(tenantConfig, buildId);
    
    if (result.success) {
      console.log('\n✅ Build completed successfully!');
      console.log(`📦 Deployment package: ${result.deploymentPackage.packagePath}`);
      process.exit(0);
    } else {
      console.error(`\n❌ Build failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export { TenantSiteBuilder };