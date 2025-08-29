# Serverless Baby Raffle Framework

A **fully serverless** baby raffle application framework built with React, Lambda, and AWS. Pay only when users access your site, with automatic scaling from 0 to thousands of users.

## 📖 **NEW USERS START HERE**
**👉 See [USER_GUIDE.md](USER_GUIDE.md) for complete setup and usage instructions, including the new dynamic slideshow system!**

**Quick Links:**
- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete user manual (start here!)
- **[QUICK_START.md](QUICK_START.md)** - Super quick reference
- **[DYNAMIC_SLIDESHOW_GUIDE.md](DYNAMIC_SLIDESHOW_GUIDE.md)** - Slideshow details

---

## 🎯 Why Serverless?

### Cost Benefits
- **Pay-per-use**: Only charged when people access the site
- **Estimated cost**: $1-5/month for typical baby raffle usage
- **No always-on servers**: Traditional approach costs $20-50/month even when unused

### Performance Benefits
- **Auto-scaling**: Handles traffic spikes automatically
- **Global CDN**: Fast loading worldwide via CloudFront
- **Sub-second response times**: Lambda cold starts optimized

### Maintenance Benefits
- **Zero server management**: AWS handles all infrastructure
- **Automatic updates**: No security patches or OS updates needed
- **High availability**: Built-in redundancy and failover

## 🚀 Quick Deployment

### For Margo (margojones.base2ml.com)
```bash
./deploy-serverless-margo.sh
```

### For Anyone Else
```bash
./deploy-serverless.sh yoursubdomain yourdomain.com
```

## 🏗 Serverless Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Users/Browsers │───▶│  CloudFront CDN  │───▶│   S3 Bucket     │
│                 │    │                  │    │  (React SPA)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   API Gateway    │───▶│ Lambda Functions│
                       │                  │    │ (Node.js APIs)  │
                       └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │ PostgreSQL RDS  │
                                                │   (Database)    │
                                                └─────────────────┘
```

## 📁 Project Structure

```
serverless-baby-raffle/
├── frontend/                 # React SPA with Vite
│   ├── src/
│   │   ├── config/           # Configuration system
│   │   ├── pages/            # React Router pages
│   │   ├── components/       # UI components
│   │   └── lib/              # API utilities
│   ├── dist/                 # Build output (deployed to S3)
│   └── package.json          # Frontend dependencies
│
├── backend/                  # Lambda functions
│   ├── functions/
│   │   ├── bets.js           # Bet management
│   │   ├── categories.js     # Category management
│   │   ├── admin.js          # Admin operations
│   │   └── stats.js          # Statistics
│   ├── lib/                  # Database utilities
│   └── serverless.yml       # Serverless configuration
│
├── infrastructure/           # CloudFormation templates
│   ├── frontend-infrastructure.yml    # S3 + CloudFront
│   └── database-infrastructure.yml    # RDS PostgreSQL
│
├── deploy-serverless.sh      # Main deployment script
└── deploy-serverless-margo.sh # Margo-specific deployment
```

## ⚡ Features

### 🎨 Fully Configurable
- **Event details**: Names, titles, messages
- **Betting categories**: Add, remove, customize
- **Payment integration**: Venmo username and instructions
- **Social sharing**: Custom text and branding
- **Images**: Easy slideshow customization

### 🔒 Production Ready
- **SSL encryption**: Automatic HTTPS via CloudFront
- **CORS configured**: Secure cross-origin requests
- **Input validation**: Comprehensive data sanitization
- **Admin authentication**: Token-based admin access
- **Payment validation**: Manual Venmo verification workflow

### 📱 Modern UX
- **Mobile responsive**: Perfect on all devices
- **Real-time updates**: Live prize pool calculations
- **Social sharing**: Built-in viral sharing
- **SPA routing**: Smooth navigation without page reloads
- **Loading states**: Proper loading indicators

## 🛠 Development

### Local Development

```bash
# Frontend development
cd frontend
npm install
npm run dev

# Backend development (requires AWS credentials)
cd backend
npm install
serverless offline
```

### Configuration Customization

Edit `frontend/src/config/custom-config.ts`:

```typescript
import { AppConfig } from './app-config';

export const yourConfig: AppConfig = {
  event: {
    parentNames: "Your Names",
    eventTitle: "Your Baby Raffle Title",
    // ... more settings
  },
  betting: {
    pricePerBet: 5.00,
    categories: [
      {
        categoryKey: "birth_date",
        displayName: "Birth Date",
        description: "When will baby arrive?",
        placeholder: "e.g., March 15, 2024"
      },
      // ... more categories
    ]
  },
  // ... payment, social, images, admin config
};
```

## 🚀 Deployment Process

### Automated Deployment
1. **Database**: PostgreSQL RDS with secrets management
2. **Backend**: Lambda functions + API Gateway
3. **Frontend**: S3 static hosting + CloudFront CDN
4. **DNS**: Route53 record for custom domain

### What Gets Created
- **3 CloudFormation stacks**: Database, Backend, Frontend
- **Lambda functions**: 4 functions for API endpoints
- **S3 bucket**: Static website hosting
- **CloudFront distribution**: Global CDN
- **API Gateway**: RESTful API endpoints
- **RDS instance**: PostgreSQL database
- **Secrets**: Database credentials in AWS Secrets Manager

## 💰 Cost Breakdown

### Typical Baby Raffle Usage (50 participants, 200 bets)
- **Lambda**: ~$0.50/month
- **API Gateway**: ~$0.10/month  
- **S3**: ~$0.25/month
- **CloudFront**: ~$0.50/month
- **RDS**: ~$15/month (smallest instance)
- **Route53**: ~$0.50/month
- **Total**: ~$17/month vs $50+/month for always-on servers

### For Multiple Events
- **Shared database**: All events can use same RDS instance
- **Separate frontends**: Each event gets own S3/CloudFront
- **Cost per additional event**: ~$2/month

## 🔧 Customization Examples

### Add New Betting Category
```typescript
{
  categoryKey: "birth_time",
  displayName: "Time of Birth",
  description: "What time will baby be born?",
  placeholder: "e.g., 3:30 AM"
}
```

### Change Prize Structure
```typescript
betting: {
  pricePerBet: 10.00,     // $10 instead of $5
  winnerPercentage: 0.75  // Winner gets 75% instead of 50%
}
```

### Custom Payment Method
```typescript
payment: {
  venmoUsername: "@YourCashApp",
  paymentInstructions: "Send payment via Cash App",
  paymentNote: "Include 'Baby Bet' in the note"
}
```

## 🎯 Perfect For

- **Baby showers**: Interactive prediction games
- **Gender reveals**: Betting on baby details
- **Office pools**: Workplace baby betting
- **Family events**: Multi-generational fun
- **Virtual celebrations**: Remote-friendly participation

## 📊 Admin Features

Access admin panel at `/admin`:
- **View all bets**: Complete overview with filtering
- **Validate payments**: Mark Venmo payments as verified  
- **Prize pool management**: Real-time totals per category
- **Export data**: Download for winner determination
- **Statistics dashboard**: Comprehensive analytics

## 🔒 Security Features

- **HTTPS everywhere**: SSL termination at CloudFront
- **CORS protection**: Proper cross-origin policies
- **Input validation**: Server-side data sanitization
- **Admin tokens**: Secure admin panel access
- **AWS IAM**: Least-privilege access controls
- **Secrets management**: Database credentials encrypted

## 📞 Support & Maintenance

### Self-Service
- **Logs**: CloudWatch logs for debugging
- **Monitoring**: Built-in AWS monitoring
- **Scaling**: Automatic with zero configuration

### Updates
- **Code changes**: Redeploy with single command
- **Infrastructure**: CloudFormation manages updates
- **Dependencies**: Automated vulnerability scanning

---

**Built for scale, optimized for cost, designed for joy!** 🎉

Transform any baby celebration into an engaging, cost-effective, serverless experience.
