#!/usr/bin/env node

/**
 * Tenant Site Deployment Script
 * 
 * This script handles the deployment of built tenant sites to:
 * 1. Static hosting (S3 + CloudFront or Netlify)
 * 2. DNS configuration for subdomains
 * 3. SSL certificate provisioning
 * 4. Health checks and rollback capability
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TenantSiteDeployer {
  constructor() {
    this.deploymentDir = path.join(__dirname, '..', 'deployments');
    
    // AWS Configuration
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.cloudfront = new AWS.CloudFront({
      region: 'us-east-1' // CloudFront is always us-east-1
    });

    this.route53 = new AWS.Route53();
    
    // Configuration
    this.config = {
      s3Bucket: process.env.AWS_S3_BUCKET || 'baby-raffle-sites',
      cloudfrontDistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION,
      route53ZoneId: process.env.AWS_ROUTE53_ZONE_ID,
      domain: process.env.DOMAIN || 'base2ml.com',
      apiBaseUrl: process.env.API_BASE_URL || 'https://api.base2ml.com'
    };
  }

  /**
   * Deploy a tenant site
   */
  async deploySite(buildId, options = {}) {
    console.log(`🚀 Starting deployment for build: ${buildId}`);

    try {
      // Load deployment manifest
      const manifest = await this.loadDeploymentManifest(buildId);
      console.log(`📋 Loaded manifest for: ${manifest.subdomain}.${this.config.domain}`);

      // Validate deployment package
      await this.validateDeploymentPackage(buildId, manifest);

      // Deploy to static hosting
      console.log('📤 Deploying to static hosting...');
      await this.deployToStaticHosting(buildId, manifest);

      // Configure DNS
      console.log('🌐 Configuring DNS...');
      await this.configureDNS(manifest);

      // Invalidate CDN cache
      console.log('🔄 Invalidating CDN cache...');
      await this.invalidateCDNCache(manifest);

      // Health check
      console.log('🏥 Performing health check...');
      const healthCheck = await this.performHealthCheck(manifest);
      
      if (!healthCheck.success) {
        throw new Error(`Health check failed: ${healthCheck.error}`);
      }

      // Update deployment status
      await this.updateDeploymentStatus(buildId, 'deployed', {
        deployedAt: new Date().toISOString(),
        url: `https://${manifest.subdomain}.${this.config.domain}`,
        healthCheck
      });

      console.log(`✅ Deployment completed successfully!`);
      console.log(`🌐 Site available at: https://${manifest.subdomain}.${this.config.domain}`);

      return {
        success: true,
        buildId,
        url: `https://${manifest.subdomain}.${this.config.domain}`,
        deployedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      
      // Update deployment status with error
      await this.updateDeploymentStatus(buildId, 'failed', {
        error: error.message,
        failedAt: new Date().toISOString()
      }).catch(console.error);

      // Attempt rollback if requested
      if (options.rollbackOnFailure) {
        console.log('🔄 Attempting rollback...');
        await this.rollbackDeployment(buildId).catch(console.error);
      }

      return {
        success: false,
        buildId,
        error: error.message
      };
    }
  }

  /**
   * Load deployment manifest
   */
  async loadDeploymentManifest(buildId) {
    const manifestPath = path.join(this.deploymentDir, buildId, 'deployment-manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(manifestContent);
  }

  /**
   * Validate deployment package
   */
  async validateDeploymentPackage(buildId, manifest) {
    const packageDir = path.join(this.deploymentDir, buildId);
    const distDir = path.join(packageDir, 'dist');

    // Check if dist directory exists
    try {
      await fs.access(distDir);
    } catch (error) {
      throw new Error('Deployment package missing dist directory');
    }

    // Check if index.html exists
    try {
      await fs.access(path.join(distDir, 'index.html'));
    } catch (error) {
      throw new Error('Deployment package missing index.html');
    }

    // Validate manifest files exist
    for (const file of manifest.files) {
      const filePath = path.join(distDir, file.path);
      try {
        await fs.access(filePath);
      } catch (error) {
        console.warn(`Warning: Manifest file not found: ${file.path}`);
      }
    }

    console.log(`✅ Deployment package validated (${manifest.files.length} files)`);
  }

  /**
   * Deploy to static hosting (S3)
   */
  async deployToStaticHosting(buildId, manifest) {
    const packageDir = path.join(this.deploymentDir, buildId);
    const distDir = path.join(packageDir, 'dist');
    const s3Prefix = `${manifest.subdomain}/`;

    // Get list of files to upload
    const filesToUpload = await this.getFilesToUpload(distDir);
    
    console.log(`📤 Uploading ${filesToUpload.length} files to S3...`);

    // Upload files to S3
    for (const file of filesToUpload) {
      const fileContent = await fs.readFile(file.localPath);
      const contentType = this.getContentType(file.key);
      
      const uploadParams = {
        Bucket: this.config.s3Bucket,
        Key: `${s3Prefix}${file.key}`,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: this.getCacheControl(file.key)
      };

      await this.s3.upload(uploadParams).promise();
      console.log(`✅ Uploaded: ${file.key}`);
    }

    console.log(`✅ All files uploaded to s3://${this.config.s3Bucket}/${s3Prefix}`);
  }

  /**
   * Get list of files to upload
   */
  async getFilesToUpload(distDir) {
    const files = [];
    
    const collectFiles = async (dir, prefix = '') => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const localPath = path.join(dir, entry.name);
        const key = prefix ? `${prefix}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          await collectFiles(localPath, key);
        } else {
          files.push({
            localPath,
            key
          });
        }
      }
    };

    await collectFiles(distDir);
    return files;
  }

  /**
   * Get content type for file
   */
  getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get cache control header
   */
  getCacheControl(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    // Long cache for assets with hash in name
    if (filename.match(/-[a-f0-9]{8,}\./)) {
      return 'public, max-age=31536000, immutable'; // 1 year
    }
    
    // Short cache for HTML and other entry points
    if (['.html', '.json'].includes(ext)) {
      return 'public, max-age=300'; // 5 minutes
    }
    
    // Medium cache for other assets
    return 'public, max-age=86400'; // 1 day
  }

  /**
   * Configure DNS (Route 53)
   */
  async configureDNS(manifest) {
    if (!this.config.route53ZoneId) {
      console.warn('⚠️  Route53 zone ID not configured, skipping DNS setup');
      return;
    }

    const recordName = `${manifest.subdomain}.${this.config.domain}`;
    
    // Check if record already exists
    const existingRecords = await this.route53.listResourceRecordSets({
      HostedZoneId: this.config.route53ZoneId,
      StartRecordName: recordName,
      StartRecordType: 'A'
    }).promise();

    const recordExists = existingRecords.ResourceRecordSets.some(
      record => record.Name === `${recordName}.` && record.Type === 'A'
    );

    if (recordExists) {
      console.log(`✅ DNS record already exists for ${recordName}`);
      return;
    }

    // Get CloudFront distribution domain name
    let cloudfrontDomain;
    if (this.config.cloudfrontDistributionId) {
      const distribution = await this.cloudfront.getDistribution({
        Id: this.config.cloudfrontDistributionId
      }).promise();
      
      cloudfrontDomain = distribution.Distribution.DomainName;
    } else {
      // Fallback to S3 website endpoint
      cloudfrontDomain = `${this.config.s3Bucket}.s3-website-${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
    }

    // Create DNS record
    const changeParams = {
      HostedZoneId: this.config.route53ZoneId,
      ChangeBatch: {
        Changes: [{
          Action: 'CREATE',
          ResourceRecordSet: {
            Name: recordName,
            Type: 'CNAME',
            TTL: 300,
            ResourceRecords: [{
              Value: cloudfrontDomain
            }]
          }
        }]
      }
    };

    const changeResult = await this.route53.changeResourceRecordSets(changeParams).promise();
    console.log(`✅ DNS record created for ${recordName} -> ${cloudfrontDomain}`);
    
    // Wait for change to propagate
    await this.route53.waitFor('resourceRecordSetsChanged', {
      Id: changeResult.ChangeInfo.Id
    }).promise();
    
    console.log(`✅ DNS change propagated`);
  }

  /**
   * Invalidate CDN cache
   */
  async invalidateCDNCache(manifest) {
    if (!this.config.cloudfrontDistributionId) {
      console.warn('⚠️  CloudFront distribution not configured, skipping cache invalidation');
      return;
    }

    const invalidationParams = {
      DistributionId: this.config.cloudfrontDistributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: [`/${manifest.subdomain}/*`]
        },
        CallerReference: `${manifest.subdomain}-${Date.now()}`
      }
    };

    const result = await this.cloudfront.createInvalidation(invalidationParams).promise();
    console.log(`✅ CloudFront invalidation created: ${result.Invalidation.Id}`);
  }

  /**
   * Perform health check
   */
  async performHealthCheck(manifest, maxRetries = 5) {
    const url = `https://${manifest.subdomain}.${this.config.domain}`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🏥 Health check attempt ${attempt}/${maxRetries}: ${url}`);
      
      try {
        const response = await fetch(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Baby-Raffle-Health-Check/1.0'
          }
        });

        if (response.ok) {
          const html = await response.text();
          
          // Basic content validation
          if (html.includes(manifest.config.title)) {
            console.log(`✅ Health check passed on attempt ${attempt}`);
            return {
              success: true,
              statusCode: response.status,
              responseTime: Date.now(), // Simplified
              attempt
            };
          } else {
            throw new Error('Site content validation failed');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Health check attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message,
            attempts: maxRetries
          };
        }
        
        // Wait before next attempt (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      attempts: maxRetries
    };
  }

  /**
   * Update deployment status via API
   */
  async updateDeploymentStatus(buildId, status, data = {}) {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/deployments/${buildId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEPLOYMENT_API_KEY}`
        },
        body: JSON.stringify({
          status,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      console.log(`✅ Deployment status updated: ${status}`);
    } catch (error) {
      console.error(`Failed to update deployment status: ${error.message}`);
    }
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(buildId) {
    console.log(`🔄 Rolling back deployment: ${buildId}`);
    
    try {
      const manifest = await this.loadDeploymentManifest(buildId);
      
      // Remove files from S3
      const s3Prefix = `${manifest.subdomain}/`;
      
      // List objects to delete
      const listParams = {
        Bucket: this.config.s3Bucket,
        Prefix: s3Prefix
      };
      
      const objectsList = await this.s3.listObjectsV2(listParams).promise();
      
      if (objectsList.Contents && objectsList.Contents.length > 0) {
        // Delete objects
        const deleteParams = {
          Bucket: this.config.s3Bucket,
          Delete: {
            Objects: objectsList.Contents.map(obj => ({ Key: obj.Key }))
          }
        };
        
        await this.s3.deleteObjects(deleteParams).promise();
        console.log(`✅ Removed ${objectsList.Contents.length} objects from S3`);
      }

      // Invalidate CDN cache
      await this.invalidateCDNCache(manifest);

      // Update status
      await this.updateDeploymentStatus(buildId, 'rolled-back', {
        rolledBackAt: new Date().toISOString()
      });

      console.log(`✅ Rollback completed for: ${manifest.subdomain}`);
      
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const buildId = process.argv[2];
  const rollbackOnFailure = process.argv.includes('--rollback-on-failure');

  if (!buildId) {
    console.error('Usage: node deploy-tenant-site.js <build-id> [--rollback-on-failure]');
    process.exit(1);
  }

  try {
    const deployer = new TenantSiteDeployer();
    const result = await deployer.deploySite(buildId, { rollbackOnFailure });
    
    if (result.success) {
      console.log('\n✅ Deployment completed successfully!');
      console.log(`🌐 Site URL: ${result.url}`);
      process.exit(0);
    } else {
      console.error(`\n❌ Deployment failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export { TenantSiteDeployer };