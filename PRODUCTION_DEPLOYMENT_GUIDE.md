# 🚀 Production Deployment Guide

## Overview

This guide covers deploying the Baby Raffle Site Builder with full OAuth integration and production-ready infrastructure.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   User Sites    │    │   Site Builder   │    │   Admin Portal     │
│ *.base2ml.com   │    │builder.base2ml.com│    │ api.base2ml.com/admin│
└─────────────────┘    └──────────────────┘    └────────────────────┘
         │                        │                         │
         │                        │                         │
    ┌────▼────────────────────────▼─────────────────────────▼─────┐
    │                    NGINX Reverse Proxy                      │
    │              (SSL Termination & Load Balancing)            │
    └─────────────────────────▼───────────────────────────────────┘
                              │
    ┌─────────────────────────▼───────────────────────────────────┐
    │                FastAPI Application                          │
    │          (OAuth, Site Creation, Admin Portal)               │
    └─────────────────────────▼───────────────────────────────────┘
                              │
    ┌─────────────────────────▼───────────────────────────────────┐
    │              PostgreSQL Database                            │
    │           (Users, Sites, Sessions, Analytics)               │
    └─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Server Requirements
- Linux server (Ubuntu 20.04+ recommended)
- 2+ CPU cores, 4GB+ RAM
- 50GB+ storage
- Public IP address
- Domain name (base2ml.com)

### Required Services
- Docker & Docker Compose
- Domain registrar access
- Google Cloud Console access (for OAuth)
- Optional: SSL certificate provider

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

## Step 2: DNS Configuration

Configure your DNS provider with the following records:

```
Type    Name                Value               TTL
A       base2ml.com         YOUR_SERVER_IP      300
A       api.base2ml.com     YOUR_SERVER_IP      300
A       builder.base2ml.com YOUR_SERVER_IP      300
A       *.base2ml.com       YOUR_SERVER_IP      300
```

## Step 3: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - App name: "Baby Raffle Site Builder"
   - User support email: your@email.com
   - Developer contact: your@email.com
   - Authorized domains: base2ml.com

6. Create OAuth 2.0 Client:
   - Application type: Web application
   - Name: "Baby Raffle Production"
   - Authorized JavaScript origins:
     - https://builder.base2ml.com
     - https://api.base2ml.com
   - Authorized redirect URIs:
     - https://api.base2ml.com/auth/callback

7. Save the Client ID and Client Secret

## Step 4: Application Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd baby-raffle-serverless/fastapi-backend

# Create environment file
cp .env.production .env

# Edit configuration
nano .env
```

Configure your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Security (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here-64-chars-minimum

# URLs
BASE_URL=https://api.base2ml.com
FRONTEND_URL=https://builder.base2ml.com

# Database
DATABASE_URL=postgresql://postgres:your-secure-password@db:5432/baby_raffle_prod

# Optional features
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@base2ml.com
```

Deploy the application:

```bash
# Make deployment script executable
chmod +x deploy-production.sh

# Deploy
./deploy-production.sh
```

## Step 5: SSL Certificate Setup

### Option A: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot certonly --webroot \
  -w /var/www/html \
  -d base2ml.com \
  -d api.base2ml.com \
  -d builder.base2ml.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# Restart nginx
docker-compose -f docker-compose.production.yml restart nginx

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /path/to/your/app/docker-compose.production.yml restart nginx
```

### Option B: Custom SSL Certificate

```bash
# Copy your certificates to the server
sudo mkdir -p /etc/letsencrypt/live/base2ml.com
sudo cp your-certificate.pem /etc/letsencrypt/live/base2ml.com/fullchain.pem
sudo cp your-private-key.pem /etc/letsencrypt/live/base2ml.com/privkey.pem
```

## Step 6: Frontend Deployment

Build and deploy the React frontend:

```bash
# Navigate to frontend directory
cd site-builder

# Install dependencies
npm install

# Build for production
npm run build

# Copy build files to nginx serve directory
sudo mkdir -p /var/www/builder
sudo cp -r build/* /var/www/builder/

# Set permissions
sudo chown -R www-data:www-data /var/www/builder
```

## Step 7: Testing

```bash
# Test API endpoints
curl https://api.base2ml.com/health
curl https://api.base2ml.com/api/builder/themes
curl https://api.base2ml.com/api/packages

# Test OAuth flow
curl https://api.base2ml.com/auth/google

# Test frontend
curl https://builder.base2ml.com
```

## Step 8: Monitoring Setup

Create monitoring script:

```bash
# Create monitoring script
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash

# Check if services are running
docker-compose -f /path/to/your/app/docker-compose.production.yml ps

# Check API health
curl -f https://api.base2ml.com/health || echo "API health check failed"

# Check database
docker-compose -f /path/to/your/app/docker-compose.production.yml exec -T db pg_isready -U postgres || echo "Database check failed"

# Check disk space
df -h | grep -E '(Filesystem|/dev/)'

# Check logs for errors
docker-compose -f /path/to/your/app/docker-compose.production.yml logs --tail=100 | grep -i error
EOF

chmod +x /home/ubuntu/monitor.sh

# Set up monitoring cron job
crontab -e
# Add: */5 * * * * /home/ubuntu/monitor.sh >> /var/log/site-builder-monitor.log 2>&1
```

## Step 9: Backup Setup

```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /path/to/your/app/docker-compose.production.yml exec -T db pg_dump -U postgres baby_raffle_prod > $BACKUP_DIR/db_$DATE.sql

# Backup site files
tar -czf $BACKUP_DIR/sites_$DATE.tar.gz /path/to/your/app/sites

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Set up daily backup
crontab -e
# Add: 0 3 * * * /home/ubuntu/backup.sh
```

## Step 10: Security Hardening

```bash
# Set up firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Secure SSH
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Update system regularly
sudo apt update && sudo apt upgrade -y
```

## Step 11: Performance Optimization

```bash
# Enable Docker logging limits
echo '{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}' | sudo tee /etc/docker/daemon.json

sudo systemctl restart docker

# Set up log rotation
sudo nano /etc/logrotate.d/baby-raffle
```

Add to logrotate config:
```
/var/log/baby-raffle*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
```

## Production URLs

After deployment, your services will be available at:

- **Site Builder**: https://builder.base2ml.com
- **API**: https://api.base2ml.com
- **API Docs**: https://api.base2ml.com/docs
- **Health Check**: https://api.base2ml.com/health
- **User Sites**: https://[subdomain].base2ml.com
- **Admin Portals**: https://api.base2ml.com/admin/[site-id]

## Troubleshooting

### Common Issues

1. **OAuth Callback Failed**
   - Check Google OAuth settings
   - Verify redirect URI matches exactly
   - Ensure HTTPS is working

2. **Database Connection Error**
   - Check PostgreSQL container logs
   - Verify DATABASE_URL in .env
   - Ensure database is initialized

3. **Site Creation Fails**
   - Check API logs: `docker-compose logs api`
   - Verify file permissions on sites directory
   - Check subdomain validation

4. **SSL Certificate Issues**
   - Verify DNS propagation: `dig base2ml.com`
   - Check certificate validity
   - Restart nginx container

### Useful Commands

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale api=2

# Database access
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d baby_raffle_prod

# Shell access
docker-compose -f docker-compose.production.yml exec api bash
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check logs and system health
2. **Monthly**: Update system packages and Docker images
3. **Quarterly**: Review security settings and certificates
4. **Annually**: Review and rotate secrets

### Updates

To update the application:

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./deploy-production.sh

# Monitor for issues
docker-compose -f docker-compose.production.yml logs -f
```

## Success Metrics

Your deployment is successful when:

- ✅ All health checks pass
- ✅ OAuth login works end-to-end
- ✅ Sites can be created and accessed
- ✅ Admin portals are functional
- ✅ SSL certificates are valid
- ✅ Monitoring and backups are running

## Support

For issues:
1. Check logs first
2. Verify environment configuration
3. Test individual components
4. Review this guide for missed steps

---

**🎉 Congratulations! Your Baby Raffle Site Builder is now production-ready with full OAuth integration and professional infrastructure.**