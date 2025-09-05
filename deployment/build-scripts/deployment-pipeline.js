#!/usr/bin/env node

/**
 * Deployment Pipeline Orchestrator
 * 
 * This script orchestrates the complete deployment pipeline:
 * 1. Triggered by successful payment webhook
 * 2. Generates tenant site from template
 * 3. Builds and deploys to subdomain
 * 4. Updates database with deployment status
 * 5. Sends confirmation notifications
 */

import { TenantSiteBuilder } from './build-tenant-site.js';
import { TenantSiteDeployer } from './deploy-tenant-site.js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentPipeline {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'https://api.base2ml.com';
    this.deploymentApiKey = process.env.DEPLOYMENT_API_KEY;
    
    if (!this.deploymentApiKey) {
      throw new Error('DEPLOYMENT_API_KEY environment variable is required');
    }
  }

  /**
   * Execute complete deployment pipeline
   */
  async deployTenantSite(tenantId, paymentData) {
    const deploymentId = `deploy-${tenantId}-${Date.now()}`;
    console.log(`🚀 Starting deployment pipeline for tenant: ${tenantId}`);
    console.log(`📋 Deployment ID: ${deploymentId}`);

    try {
      // 1. Fetch tenant configuration from API
      console.log('📡 Fetching tenant configuration...');
      const tenantConfig = await this.fetchTenantConfig(tenantId);
      
      // 2. Create deployment record
      console.log('📝 Creating deployment record...');
      await this.createDeploymentRecord(deploymentId, tenantId, tenantConfig);

      // 3. Build tenant site
      console.log('🏗️  Building tenant site...');
      const builder = new TenantSiteBuilder();
      const buildResult = await builder.buildSite(tenantConfig, deploymentId);
      
      if (!buildResult.success) {
        throw new Error(`Build failed: ${buildResult.error}`);
      }

      // 4. Deploy tenant site
      console.log('🚀 Deploying tenant site...');
      const deployer = new TenantSiteDeployer();
      const deployResult = await deployer.deploySite(deploymentId, {
        rollbackOnFailure: true
      });
      
      if (!deployResult.success) {
        throw new Error(`Deployment failed: ${deployResult.error}`);
      }

      // 5. Update tenant record with live site URL
      console.log('📝 Updating tenant record...');
      await this.updateTenantRecord(tenantId, {
        siteUrl: deployResult.url,
        deploymentStatus: 'live',
        deployedAt: deployResult.deployedAt
      });

      // 6. Send confirmation notification
      console.log('📧 Sending confirmation notification...');
      await this.sendDeploymentNotification(tenantId, {
        status: 'success',
        siteUrl: deployResult.url,
        deploymentId
      });

      // 7. Start billing cycle
      console.log('💳 Starting billing cycle...');
      await this.startBillingCycle(tenantId, paymentData);

      console.log('\n🎉 Deployment pipeline completed successfully!');
      console.log(`🌐 Site deployed to: ${deployResult.url}`);

      return {
        success: true,
        deploymentId,
        siteUrl: deployResult.url,
        tenantId,
        deployedAt: deployResult.deployedAt
      };

    } catch (error) {
      console.error('❌ Deployment pipeline failed:', error.message);

      // Update deployment record with error
      await this.updateDeploymentRecord(deploymentId, {
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      }).catch(console.error);

      // Send failure notification
      await this.sendDeploymentNotification(tenantId, {
        status: 'failed',
        error: error.message,
        deploymentId
      }).catch(console.error);

      return {
        success: false,
        deploymentId,
        tenantId,
        error: error.message
      };
    }
  }

  /**
   * Fetch tenant configuration from API
   */
  async fetchTenantConfig(tenantId) {
    const response = await fetch(`${this.apiBaseUrl}/api/tenants/${tenantId}/config`, {
      headers: {
        'Authorization': `Bearer ${this.deploymentApiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tenant config: HTTP ${response.status}`);
    }

    const config = await response.json();
    
    // Validate required configuration
    if (!config.subdomain) {
      throw new Error('Tenant configuration missing subdomain');
    }
    
    if (!config.parentInfo || !config.parentInfo.motherName) {
      throw new Error('Tenant configuration missing parent information');
    }

    return config;
  }

  /**
   * Create deployment record
   */
  async createDeploymentRecord(deploymentId, tenantId, config) {
    const response = await fetch(`${this.apiBaseUrl}/api/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.deploymentApiKey}`
      },
      body: JSON.stringify({
        id: deploymentId,
        tenantId,
        subdomain: config.subdomain,
        status: 'building',
        config: {
          title: config.siteSettings?.title,
          description: config.siteSettings?.description
        },
        startedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create deployment record: HTTP ${response.status}`);
    }

    console.log(`✅ Deployment record created: ${deploymentId}`);
  }

  /**
   * Update deployment record
   */
  async updateDeploymentRecord(deploymentId, updates) {
    const response = await fetch(`${this.apiBaseUrl}/api/deployments/${deploymentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.deploymentApiKey}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      console.error(`Failed to update deployment record: HTTP ${response.status}`);
    }
  }

  /**
   * Update tenant record
   */
  async updateTenantRecord(tenantId, updates) {
    const response = await fetch(`${this.apiBaseUrl}/api/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.deploymentApiKey}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update tenant record: HTTP ${response.status}`);
    }

    console.log(`✅ Tenant record updated: ${tenantId}`);
  }

  /**
   * Send deployment notification
   */
  async sendDeploymentNotification(tenantId, data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/notifications/deployment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.deploymentApiKey}`
        },
        body: JSON.stringify({
          tenantId,
          type: 'deployment',
          ...data
        })
      });

      if (response.ok) {
        console.log(`✅ Notification sent for tenant: ${tenantId}`);
      } else {
        console.error(`Failed to send notification: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Start billing cycle
   */
  async startBillingCycle(tenantId, paymentData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/billing/start-cycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.deploymentApiKey}`
        },
        body: JSON.stringify({
          tenantId,
          paymentIntentId: paymentData.paymentIntentId,
          subscriptionMonths: paymentData.subscriptionMonths,
          startDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log(`✅ Billing cycle started for tenant: ${tenantId}`);
      } else {
        console.error(`Failed to start billing cycle: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to start billing cycle: ${error.message}`);
    }
  }

  /**
   * Handle payment webhook and trigger deployment
   */
  async handlePaymentWebhook(webhookData) {
    console.log('🔔 Processing payment webhook...');
    
    try {
      const { tenantId, paymentIntentId, status } = webhookData;
      
      if (status !== 'succeeded') {
        console.log(`⚠️  Payment not succeeded, skipping deployment: ${status}`);
        return { success: false, reason: 'Payment not succeeded' };
      }

      // Verify payment hasn't already been processed
      const existingDeployment = await this.checkExistingDeployment(tenantId);
      if (existingDeployment) {
        console.log(`⚠️  Deployment already exists for tenant: ${tenantId}`);
        return { success: false, reason: 'Already deployed' };
      }

      // Extract payment data
      const paymentData = {
        paymentIntentId,
        subscriptionMonths: webhookData.metadata?.subscriptionMonths || 1,
        amount: webhookData.amount,
        currency: webhookData.currency
      };

      // Execute deployment pipeline
      return await this.deployTenantSite(tenantId, paymentData);
      
    } catch (error) {
      console.error('❌ Webhook processing failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if deployment already exists for tenant
   */
  async checkExistingDeployment(tenantId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/tenants/${tenantId}/deployment`, {
        headers: {
          'Authorization': `Bearer ${this.deploymentApiKey}`
        }
      });

      if (response.ok) {
        const deployment = await response.json();
        return deployment.status === 'deployed' || deployment.status === 'building';
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to check existing deployment: ${error.message}`);
      return false;
    }
  }
}

// Webhook handler for Express/FastAPI integration
export const createWebhookHandler = () => {
  const pipeline = new DeploymentPipeline();
  
  return async (req, res) => {
    try {
      const result = await pipeline.handlePaymentWebhook(req.body);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          deploymentId: result.deploymentId,
          siteUrl: result.siteUrl
        });
      } else {
        res.status(400).json({
          success: false,
          reason: result.reason || result.error
        });
      }
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'deploy') {
    const tenantId = process.argv[3];
    const paymentData = process.argv[4] ? JSON.parse(process.argv[4]) : {};
    
    if (!tenantId) {
      console.error('Usage: node deployment-pipeline.js deploy <tenant-id> [payment-data-json]');
      process.exit(1);
    }
    
    try {
      const pipeline = new DeploymentPipeline();
      const result = await pipeline.deployTenantSite(tenantId, paymentData);
      
      if (result.success) {
        console.log('\n✅ Pipeline completed successfully!');
        console.log(`🌐 Site URL: ${result.siteUrl}`);
        process.exit(0);
      } else {
        console.error(`\n❌ Pipeline failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } else {
    console.error('Usage: node deployment-pipeline.js deploy <tenant-id> [payment-data-json]');
    process.exit(1);
  }
}

export { DeploymentPipeline };