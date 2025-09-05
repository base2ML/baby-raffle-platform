#!/usr/bin/env node

/**
 * Infrastructure Setup Script
 * 
 * This script sets up the complete infrastructure for the Baby Raffle SaaS platform:
 * 1. AWS resources (S3, CloudFront, Route53, RDS)
 * 2. OAuth applications (Google, Apple)
 * 3. Stripe webhooks and configuration
 * 4. Environment variables and secrets
 * 5. SSL certificates and DNS configuration
 */

import AWS from 'aws-sdk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InfrastructureSetup {
  constructor() {
    this.config = {
      domain: process.env.DOMAIN || 'base2ml.com',
      region: process.env.AWS_REGION || 'us-east-1',
      environment: process.env.ENVIRONMENT || 'production',
      stackName: `baby-raffle-${process.env.ENVIRONMENT || 'production'}`,
    };

    // AWS Services
    this.cloudformation = new AWS.CloudFormation({ region: this.config.region });
    this.s3 = new AWS.S3({ region: this.config.region });
    this.rds = new AWS.RDS({ region: this.config.region });
    this.route53 = new AWS.Route53();
    this.cloudfront = new AWS.CloudFront({ region: 'us-east-1' });
    this.acm = new AWS.ACM({ region: 'us-east-1' }); // ACM for CloudFront must be us-east-1
    this.secretsManager = new AWS.SecretsManager({ region: this.config.region });
  }

  /**
   * Setup complete infrastructure
   */
  async setupInfrastructure() {
    console.log('🚀 Starting infrastructure setup...');
    console.log(`📋 Environment: ${this.config.environment}`);
    console.log(`🌍 Region: ${this.config.region}`);
    console.log(`🌐 Domain: ${this.config.domain}`);

    try {
      // 1. Setup AWS infrastructure
      console.log('\n📡 Setting up AWS infrastructure...');
      const awsResources = await this.setupAWSInfrastructure();

      // 2. Setup SSL certificates
      console.log('\n🔒 Setting up SSL certificates...');
      const sslCertificate = await this.setupSSLCertificate();

      // 3. Setup DNS
      console.log('\n🌐 Setting up DNS...');
      await this.setupDNS(awsResources, sslCertificate);

      // 4. Setup database
      console.log('\n🗄️  Setting up database...');
      const database = await this.setupDatabase();

      // 5. Setup OAuth applications
      console.log('\n🔐 Setting up OAuth applications...');
      const oauthConfig = await this.setupOAuth();

      // 6. Setup Stripe
      console.log('\n💳 Setting up Stripe...');
      const stripeConfig = await this.setupStripe();

      // 7. Create environment configuration
      console.log('\n⚙️  Creating environment configuration...');
      const envConfig = await this.createEnvironmentConfig({
        awsResources,
        database,
        oauthConfig,
        stripeConfig,
        sslCertificate
      });

      // 8. Setup monitoring and alerts
      console.log('\n📊 Setting up monitoring...');
      await this.setupMonitoring(awsResources);

      console.log('\n✅ Infrastructure setup completed successfully!');
      console.log('\n📋 Setup Summary:');
      console.log(`   API URL: https://api.${this.config.domain}`);
      console.log(`   Marketing Site: https://mybabyraffle.${this.config.domain}`);
      console.log(`   Site Builder: https://builder.${this.config.domain}`);
      console.log(`   Database: ${database.endpoint}`);
      console.log(`   S3 Bucket: ${awsResources.s3Bucket}`);
      console.log(`   CloudFront: ${awsResources.cloudfrontDomain}`);

      return {
        success: true,
        resources: {
          awsResources,
          database,
          oauthConfig,
          stripeConfig,
          sslCertificate,
          envConfig
        }
      };

    } catch (error) {
      console.error('❌ Infrastructure setup failed:', error.message);
      console.error('Stack trace:', error.stack);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup AWS infrastructure using CloudFormation
   */
  async setupAWSInfrastructure() {
    console.log('📦 Creating CloudFormation stack...');

    const template = await this.generateCloudFormationTemplate();
    const templatePath = path.join(__dirname, 'cloudformation-template.json');
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

    const stackParams = {
      StackName: this.config.stackName,
      TemplateBody: JSON.stringify(template),
      Capabilities: ['CAPABILITY_IAM'],
      Parameters: [
        {
          ParameterKey: 'Environment',
          ParameterValue: this.config.environment
        },
        {
          ParameterKey: 'Domain',
          ParameterValue: this.config.domain
        }
      ]
    };

    try {
      // Check if stack exists
      await this.cloudformation.describeStacks({
        StackName: this.config.stackName
      }).promise();
      
      console.log('📝 Stack exists, updating...');
      await this.cloudformation.updateStack(stackParams).promise();
      
    } catch (error) {
      if (error.code === 'ValidationError' && error.message.includes('does not exist')) {
        console.log('🆕 Creating new stack...');
        await this.cloudformation.createStack(stackParams).promise();
      } else {
        throw error;
      }
    }

    // Wait for stack to complete
    console.log('⏳ Waiting for stack operation to complete...');
    await this.cloudformation.waitFor('stackCreateComplete', {
      StackName: this.config.stackName
    }).promise();

    // Get stack outputs
    const stackDescription = await this.cloudformation.describeStacks({
      StackName: this.config.stackName
    }).promise();

    const outputs = {};
    if (stackDescription.Stacks[0].Outputs) {
      stackDescription.Stacks[0].Outputs.forEach(output => {
        outputs[output.OutputKey] = output.OutputValue;
      });
    }

    console.log('✅ AWS infrastructure created successfully');

    return {
      stackName: this.config.stackName,
      s3Bucket: outputs.S3BucketName,
      cloudfrontDistributionId: outputs.CloudFrontDistributionId,
      cloudfrontDomain: outputs.CloudFrontDomainName,
      route53HostedZoneId: outputs.Route53HostedZoneId,
      ...outputs
    };
  }

  /**
   * Generate CloudFormation template
   */
  async generateCloudFormationTemplate() {
    return {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Baby Raffle SaaS Infrastructure',
      
      Parameters: {
        Environment: {
          Type: 'String',
          Default: 'production',
          Description: 'Environment name'
        },
        Domain: {
          Type: 'String',
          Default: 'base2ml.com',
          Description: 'Root domain name'
        }
      },

      Resources: {
        // S3 Bucket for static sites
        TenantSitesBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': '${Environment}-baby-raffle-sites' },
            PublicReadPolicy: {
              BlockPublicAcls: false,
              BlockPublicPolicy: false,
              IgnorePublicAcls: false,
              RestrictPublicBuckets: false
            },
            WebsiteConfiguration: {
              IndexDocument: 'index.html',
              ErrorDocument: 'index.html'
            },
            CorsConfiguration: {
              CorsRules: [{
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'HEAD'],
                AllowedOrigins: ['*'],
                MaxAge: 3600
              }]
            }
          }
        },

        // S3 Bucket Policy for public read
        TenantSitesBucketPolicy: {
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { Ref: 'TenantSitesBucket' },
            PolicyDocument: {
              Statement: [{
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: { 'Fn::Sub': '${TenantSitesBucket}/*' }
              }]
            }
          }
        },

        // CloudFront Distribution
        CloudFrontDistribution: {
          Type: 'AWS::CloudFront::Distribution',
          Properties: {
            DistributionConfig: {
              Enabled: true,
              Comment: { 'Fn::Sub': 'Baby Raffle ${Environment} - Tenant Sites' },
              DefaultRootObject: 'index.html',
              
              Origins: [{
                Id: 'S3Origin',
                DomainName: { 'Fn::GetAtt': ['TenantSitesBucket', 'DomainName'] },
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'http-only'
                }
              }],

              DefaultCacheBehavior: {
                TargetOriginId: 'S3Origin',
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: ['GET', 'HEAD'],
                CachedMethods: ['GET', 'HEAD'],
                ForwardedValues: {
                  QueryString: false,
                  Cookies: { Forward: 'none' }
                },
                MinTTL: 0,
                DefaultTTL: 86400,
                MaxTTL: 31536000
              },

              CustomErrorResponses: [{
                ErrorCode: 404,
                ResponseCode: 200,
                ResponsePagePath: '/index.html',
                ErrorCachingMinTTL: 300
              }],

              PriceClass: 'PriceClass_100',
              ViewerCertificate: {
                CloudFrontDefaultCertificate: true
              }
            }
          }
        },

        // Route53 Hosted Zone
        HostedZone: {
          Type: 'AWS::Route53::HostedZone',
          Properties: {
            Name: { Ref: 'Domain' },
            HostedZoneConfig: {
              Comment: { 'Fn::Sub': 'Baby Raffle ${Environment} Hosted Zone' }
            }
          }
        },

        // RDS Subnet Group
        DBSubnetGroup: {
          Type: 'AWS::RDS::DBSubnetGroup',
          Properties: {
            DBSubnetGroupDescription: 'Subnet group for RDS database',
            SubnetIds: [
              { Ref: 'PrivateSubnet1' },
              { Ref: 'PrivateSubnet2' }
            ],
            Tags: [
              { Key: 'Name', Value: { 'Fn::Sub': '${Environment}-baby-raffle-db-subnet-group' } }
            ]
          }
        },

        // VPC for RDS
        VPC: {
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: '10.0.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            Tags: [
              { Key: 'Name', Value: { 'Fn::Sub': '${Environment}-baby-raffle-vpc' } }
            ]
          }
        },

        // Private Subnets for RDS
        PrivateSubnet1: {
          Type: 'AWS::EC2::Subnet',
          Properties: {
            VpcId: { Ref: 'VPC' },
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: { 'Fn::Select': [0, { 'Fn::GetAZs': '' }] },
            Tags: [
              { Key: 'Name', Value: { 'Fn::Sub': '${Environment}-baby-raffle-private-1' } }
            ]
          }
        },

        PrivateSubnet2: {
          Type: 'AWS::EC2::Subnet',
          Properties: {
            VpcId: { Ref: 'VPC' },
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: { 'Fn::Select': [1, { 'Fn::GetAZs': '' }] },
            Tags: [
              { Key: 'Name', Value: { 'Fn::Sub': '${Environment}-baby-raffle-private-2' } }
            ]
          }
        },

        // Security Group for RDS
        DatabaseSecurityGroup: {
          Type: 'AWS::EC2::SecurityGroup',
          Properties: {
            GroupDescription: 'Security group for RDS database',
            VpcId: { Ref: 'VPC' },
            SecurityGroupIngress: [{
              IpProtocol: 'tcp',
              FromPort: 5432,
              ToPort: 5432,
              CidrIp: '10.0.0.0/16'
            }],
            Tags: [
              { Key: 'Name', Value: { 'Fn::Sub': '${Environment}-baby-raffle-db-sg' } }
            ]
          }
        }
      },

      Outputs: {
        S3BucketName: {
          Description: 'Name of the S3 bucket for tenant sites',
          Value: { Ref: 'TenantSitesBucket' }
        },
        CloudFrontDistributionId: {
          Description: 'CloudFront Distribution ID',
          Value: { Ref: 'CloudFrontDistribution' }
        },
        CloudFrontDomainName: {
          Description: 'CloudFront Domain Name',
          Value: { 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] }
        },
        Route53HostedZoneId: {
          Description: 'Route53 Hosted Zone ID',
          Value: { Ref: 'HostedZone' }
        },
        VPCId: {
          Description: 'VPC ID',
          Value: { Ref: 'VPC' }
        },
        DatabaseSecurityGroupId: {
          Description: 'Database Security Group ID',
          Value: { Ref: 'DatabaseSecurityGroup' }
        },
        DBSubnetGroupName: {
          Description: 'DB Subnet Group Name',
          Value: { Ref: 'DBSubnetGroup' }
        }
      }
    };
  }

  /**
   * Setup SSL certificate
   */
  async setupSSLCertificate() {
    console.log('🔒 Requesting SSL certificate...');

    const domainName = `*.${this.config.domain}`;
    
    try {
      // Check for existing certificate
      const certificates = await this.acm.listCertificates({
        CertificateStatuses: ['ISSUED', 'PENDING_VALIDATION']
      }).promise();

      let certificateArn = null;
      
      for (const cert of certificates.CertificateSummaryList) {
        if (cert.DomainName === domainName) {
          certificateArn = cert.CertificateArn;
          console.log(`✅ Found existing certificate: ${certificateArn}`);
          break;
        }
      }

      if (!certificateArn) {
        // Request new certificate
        console.log(`📝 Requesting new certificate for: ${domainName}`);
        
        const certRequest = await this.acm.requestCertificate({
          DomainName: domainName,
          SubjectAlternativeNames: [this.config.domain],
          ValidationMethod: 'DNS'
        }).promise();

        certificateArn = certRequest.CertificateArn;
        
        console.log(`⏳ Certificate requested: ${certificateArn}`);
        console.log('⚠️  You will need to validate the certificate via DNS');
        console.log('   Check AWS Console -> Certificate Manager for DNS validation records');
      }

      return {
        certificateArn,
        domainName,
        needsValidation: certificateArn.includes('pending')
      };

    } catch (error) {
      console.error('Failed to setup SSL certificate:', error.message);
      throw error;
    }
  }

  /**
   * Setup DNS records
   */
  async setupDNS(awsResources, sslCertificate) {
    console.log('🌐 Setting up DNS records...');

    const hostedZoneId = awsResources.route53HostedZoneId;
    const cloudfrontDomain = awsResources.cloudfrontDomain;

    // DNS records to create
    const records = [
      {
        name: `*.${this.config.domain}`,
        type: 'CNAME',
        value: cloudfrontDomain,
        comment: 'Wildcard for tenant sites'
      },
      {
        name: `api.${this.config.domain}`,
        type: 'CNAME',
        value: 'your-api-host.example.com', // Update with actual API host
        comment: 'API backend'
      },
      {
        name: `builder.${this.config.domain}`,
        type: 'CNAME',
        value: 'your-builder-host.example.com', // Update with actual builder host
        comment: 'Site builder application'
      },
      {
        name: `mybabyraffle.${this.config.domain}`,
        type: 'CNAME',
        value: 'your-marketing-host.example.com', // Update with actual marketing host
        comment: 'Marketing site'
      }
    ];

    for (const record of records) {
      try {
        await this.route53.changeResourceRecordSets({
          HostedZoneId: hostedZoneId,
          ChangeBatch: {
            Comment: record.comment,
            Changes: [{
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: record.name,
                Type: record.type,
                TTL: 300,
                ResourceRecords: [{ Value: record.value }]
              }
            }]
          }
        }).promise();

        console.log(`✅ DNS record created: ${record.name} -> ${record.value}`);
      } catch (error) {
        console.error(`Failed to create DNS record for ${record.name}:`, error.message);
      }
    }
  }

  /**
   * Setup database
   */
  async setupDatabase() {
    console.log('🗄️  Setting up PostgreSQL database...');

    const dbInstanceId = `baby-raffle-${this.config.environment}`;
    
    try {
      // Check if database exists
      await this.rds.describeDBInstances({
        DBInstanceIdentifier: dbInstanceId
      }).promise();
      
      console.log('✅ Database already exists');
      
      // Get database details
      const dbDetails = await this.rds.describeDBInstances({
        DBInstanceIdentifier: dbInstanceId
      }).promise();
      
      const dbInstance = dbDetails.DBInstances[0];
      
      return {
        identifier: dbInstanceId,
        endpoint: dbInstance.Endpoint.Address,
        port: dbInstance.Endpoint.Port,
        engine: dbInstance.Engine
      };
      
    } catch (error) {
      if (error.code === 'DBInstanceNotFoundFault') {
        console.log('🆕 Creating new database...');
        
        // Get CloudFormation outputs for VPC info
        const stackOutputs = await this.getStackOutputs();
        
        const dbParams = {
          DBInstanceIdentifier: dbInstanceId,
          DBInstanceClass: 'db.t3.micro',
          Engine: 'postgres',
          EngineVersion: '14.9',
          AllocatedStorage: 20,
          StorageType: 'gp2',
          StorageEncrypted: true,
          
          DBName: 'babyraffle',
          MasterUsername: 'postgres',
          MasterUserPassword: this.generatePassword(16),
          
          DBSubnetGroupName: stackOutputs.DBSubnetGroupName,
          VpcSecurityGroupIds: [stackOutputs.DatabaseSecurityGroupId],
          
          BackupRetentionPeriod: 7,
          PreferredBackupWindow: '03:00-04:00',
          PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
          
          DeletionProtection: this.config.environment === 'production',
          
          Tags: [
            { Key: 'Environment', Value: this.config.environment },
            { Key: 'Application', Value: 'baby-raffle' }
          ]
        };

        // Store database password in Secrets Manager
        await this.secretsManager.createSecret({
          Name: `baby-raffle/${this.config.environment}/database`,
          Description: 'Baby Raffle database credentials',
          SecretString: JSON.stringify({
            username: dbParams.MasterUsername,
            password: dbParams.MasterUserPassword,
            engine: 'postgres',
            host: '', // Will be updated after creation
            port: 5432,
            dbname: dbParams.DBName
          })
        }).promise();

        const result = await this.rds.createDBInstance(dbParams).promise();
        
        console.log('⏳ Waiting for database to be available...');
        await this.rds.waitFor('dBInstanceAvailable', {
          DBInstanceIdentifier: dbInstanceId
        }).promise();

        console.log('✅ Database created successfully');
        
        return {
          identifier: dbInstanceId,
          endpoint: result.DBInstance.Endpoint.Address,
          port: result.DBInstance.Endpoint.Port,
          engine: result.DBInstance.Engine
        };
        
      } else {
        throw error;
      }
    }
  }

  /**
   * Setup OAuth applications
   */
  async setupOAuth() {
    console.log('🔐 Setting up OAuth applications...');
    
    // This would typically involve:
    // 1. Creating Google OAuth application
    // 2. Creating Apple Sign In configuration
    // 3. Storing credentials in Secrets Manager
    
    const oauthConfig = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'REPLACE_WITH_GOOGLE_CLIENT_ID',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'REPLACE_WITH_GOOGLE_CLIENT_SECRET',
        redirectUri: `https://api.${this.config.domain}/auth/google/callback`
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID || 'REPLACE_WITH_APPLE_CLIENT_ID',
        teamId: process.env.APPLE_TEAM_ID || 'REPLACE_WITH_APPLE_TEAM_ID',
        keyId: process.env.APPLE_KEY_ID || 'REPLACE_WITH_APPLE_KEY_ID',
        privateKey: process.env.APPLE_PRIVATE_KEY || 'REPLACE_WITH_APPLE_PRIVATE_KEY',
        redirectUri: `https://api.${this.config.domain}/auth/apple/callback`
      }
    };

    // Store OAuth configuration in Secrets Manager
    try {
      await this.secretsManager.createSecret({
        Name: `baby-raffle/${this.config.environment}/oauth`,
        Description: 'OAuth application credentials',
        SecretString: JSON.stringify(oauthConfig)
      }).promise();
      
      console.log('✅ OAuth configuration stored in Secrets Manager');
    } catch (error) {
      if (error.code === 'ResourceExistsException') {
        console.log('⚠️  OAuth configuration already exists in Secrets Manager');
      } else {
        throw error;
      }
    }

    return oauthConfig;
  }

  /**
   * Setup Stripe configuration
   */
  async setupStripe() {
    console.log('💳 Setting up Stripe configuration...');
    
    const stripeConfig = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'REPLACE_WITH_STRIPE_PUBLISHABLE_KEY',
      secretKey: process.env.STRIPE_SECRET_KEY || 'REPLACE_WITH_STRIPE_SECRET_KEY',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'REPLACE_WITH_STRIPE_WEBHOOK_SECRET',
      webhookUrl: `https://api.${this.config.domain}/api/billing/webhook`,
      pricing: {
        setupFee: 2000, // $20.00 in cents
        monthlyFee: 1000 // $10.00 in cents
      }
    };

    // Store Stripe configuration in Secrets Manager
    try {
      await this.secretsManager.createSecret({
        Name: `baby-raffle/${this.config.environment}/stripe`,
        Description: 'Stripe payment configuration',
        SecretString: JSON.stringify(stripeConfig)
      }).promise();
      
      console.log('✅ Stripe configuration stored in Secrets Manager');
    } catch (error) {
      if (error.code === 'ResourceExistsException') {
        console.log('⚠️  Stripe configuration already exists in Secrets Manager');
      } else {
        throw error;
      }
    }

    return stripeConfig;
  }

  /**
   * Create environment configuration
   */
  async createEnvironmentConfig(resources) {
    console.log('⚙️  Generating environment configuration...');

    const envConfig = {
      // Database
      DATABASE_URL: `postgresql://postgres:PASSWORD@${resources.database.endpoint}:${resources.database.port}/babyraffle`,
      
      // AWS
      AWS_REGION: this.config.region,
      AWS_S3_BUCKET: resources.awsResources.s3Bucket,
      AWS_CLOUDFRONT_DISTRIBUTION: resources.awsResources.cloudfrontDistributionId,
      AWS_ROUTE53_ZONE_ID: resources.awsResources.route53HostedZoneId,
      
      // Application URLs
      API_BASE_URL: `https://api.${this.config.domain}`,
      FRONTEND_URL: `https://mybabyraffle.${this.config.domain}`,
      BUILDER_URL: `https://builder.${this.config.domain}`,
      DOMAIN: this.config.domain,
      
      // OAuth
      GOOGLE_CLIENT_ID: resources.oauthConfig.google.clientId,
      GOOGLE_CLIENT_SECRET: resources.oauthConfig.google.clientSecret,
      APPLE_CLIENT_ID: resources.oauthConfig.apple.clientId,
      APPLE_TEAM_ID: resources.oauthConfig.apple.teamId,
      APPLE_KEY_ID: resources.oauthConfig.apple.keyId,
      
      // Stripe
      STRIPE_PUBLISHABLE_KEY: resources.stripeConfig.publishableKey,
      STRIPE_SECRET_KEY: resources.stripeConfig.secretKey,
      STRIPE_WEBHOOK_SECRET: resources.stripeConfig.webhookSecret,
      
      // Security
      JWT_SECRET: this.generateSecret(32),
      DEPLOYMENT_API_KEY: this.generateSecret(32),
      
      // Environment
      ENVIRONMENT: this.config.environment,
      NODE_ENV: 'production'
    };

    // Save environment file
    const envFilePath = path.join(__dirname, '..', '..', '.env.production');
    const envFileContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    await fs.writeFile(envFilePath, envFileContent);
    console.log(`✅ Environment configuration saved to: ${envFilePath}`);

    return envConfig;
  }

  /**
   * Setup monitoring and alerts
   */
  async setupMonitoring(resources) {
    console.log('📊 Setting up monitoring...');
    
    // This would typically setup:
    // - CloudWatch alarms
    // - Log groups
    // - Health check monitoring
    // - Cost alerts
    
    console.log('⚠️  Monitoring setup is a placeholder - implement based on your needs');
    console.log('   Consider setting up:');
    console.log('   - CloudWatch alarms for database performance');
    console.log('   - Cost alerts for AWS usage');
    console.log('   - Application performance monitoring');
    console.log('   - Error tracking and alerting');
  }

  /**
   * Get CloudFormation stack outputs
   */
  async getStackOutputs() {
    const stackDescription = await this.cloudformation.describeStacks({
      StackName: this.config.stackName
    }).promise();

    const outputs = {};
    if (stackDescription.Stacks[0].Outputs) {
      stackDescription.Stacks[0].Outputs.forEach(output => {
        outputs[output.OutputKey] = output.OutputValue;
      });
    }

    return outputs;
  }

  /**
   * Generate secure password
   */
  generatePassword(length) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Generate secure secret
   */
  generateSecret(length) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let secret = '';
    
    for (let i = 0; i < length; i++) {
      secret += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return secret;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const setup = new InfrastructureSetup();
    const result = await setup.setupInfrastructure();
    
    if (result.success) {
      console.log('\n🎉 Infrastructure setup completed successfully!');
      process.exit(0);
    } else {
      console.error(`\n❌ Infrastructure setup failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export { InfrastructureSetup };