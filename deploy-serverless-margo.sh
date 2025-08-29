#!/bin/bash

# Margo's Serverless Baby Raffle Deployment Script
# Customized serverless deployment for margojones.base2ml.com

set -e

echo "🚀 Deploying Serverless Baby Raffle for Margo at margojones.base2ml.com"
echo ""

# Configuration for Margo
SUBDOMAIN="margojones"
DOMAIN="base2ml.com"

# Pre-deployment setup for Margo's configuration
echo "📝 Setting up Margo's custom configuration..."

# Update the frontend configuration for Margo
cat > frontend/src/config/margo-config.ts << 'EOF'
import { AppConfig } from './app-config';

// Margo's Baby Raffle Configuration - Serverless Version
export const margoConfig: AppConfig = {
  event: {
    parentNames: "Margo & Partner",
    eventTitle: "Welcome to Margo's Baby Raffle!",
    eventSubtitle: "Help us celebrate our little miracle on the way",
    welcomeMessage: "Join us in this exciting journey as we prepare to welcome our little one!",
    footerMessage: "Thank you for being part of our journey. We can't wait to meet our little miracle!"
  },
  
  betting: {
    pricePerBet: 5.00,
    winnerPercentage: 0.5,
    currency: "USD",
    categories: [
      {
        categoryKey: "birth_date",
        displayName: "Birth Date",
        description: "When will baby arrive?",
        placeholder: "e.g., March 15, 2024"
      },
      {
        categoryKey: "birth_weight",
        displayName: "Birth Weight", 
        description: "How much will baby weigh?",
        placeholder: "e.g., 7 lbs 8 oz"
      },
      {
        categoryKey: "birth_length",
        displayName: "Birth Length",
        description: "How long will baby be?",
        placeholder: "e.g., 20 inches"
      },
      {
        categoryKey: "gender",
        displayName: "Gender",
        description: "What will baby be?",
        placeholder: "Boy or Girl"
      },
      {
        categoryKey: "eye_color",
        displayName: "Eye Color",
        description: "What color eyes will baby have?",
        placeholder: "e.g., Brown, Blue, Green, Hazel"
      },
      {
        categoryKey: "hair_color",
        displayName: "Hair Color",
        description: "What color hair will baby have?",
        placeholder: "e.g., Blonde, Brown, Black, Red"
      },
      {
        categoryKey: "looks_like",
        displayName: "Family Resemblance",
        description: "Who will baby look like more?",
        placeholder: "Margo, Partner, or Perfect mix"
      },
      {
        categoryKey: "first_word",
        displayName: "First Word",
        description: "What will baby's first word be?",
        placeholder: "e.g., Mama, Dada, Hi"
      }
    ]
  },
  
  payment: {
    venmoUsername: "@Margo-Jones", // TODO: Update with actual Venmo username
    paymentInstructions: "Send your bet amount via Venmo to complete your entry!",
    paymentNote: "Include your name and 'Baby Raffle' in the Venmo note. Your bets will be verified once payment is received."
  },
  
  social: {
    shareTitle: "Join Margo's Baby Raffle!",
    shareText: "I'm placing bets in Margo's baby raffle! Join me and guess details about her little one. $5 per bet, winner takes 50% of the pot!",
    shareTextExpanded: "I'm joining Margo's baby raffle! Come make predictions about her little one's arrival with me. $5 per bet and amazing prizes await the best guessers!"
  },
  
  images: {
    slideshow: [
      {
        src: "/expecting-couple-baby-shoes.png",
        caption: "Welcome to Margo's Baby Journey!",
        subtitle: "Join us in celebrating this magical time",
        alt: "Expecting parents with baby shoes"
      },
      {
        src: "/beautiful-baby-nursery.png", 
        caption: "The Nursery is Ready & Waiting!",
        subtitle: "Every detail prepared with love and excitement",
        alt: "Beautiful baby nursery ready for arrival"
      },
      {
        src: "/baby-shower-diapers-gifts.png",
        caption: "Join Our Baby Raffle & Make Your Predictions!",
        subtitle: "Fun prizes and excitement await the winners",
        alt: "Baby shower celebration with gifts and surprises"
      }
    ]
  },
  
  admin: {
    adminTitle: "Margo's Baby Raffle Admin",
    supportEmail: "margo@margojones.base2ml.com"
  }
};

export default margoConfig;
EOF

# Update the custom-config.ts to use Margo's config
cat > frontend/src/config/custom-config.ts << 'EOF'
import margoConfig from './margo-config';
export default margoConfig;
EOF

echo "✅ Margo's configuration set up"

# Update the HTML title for Margo
sed -i.bak 's/<title>Baby Raffle<\/title>/<title>Margo'\''s Baby Raffle<\/title>/' frontend/index.html
echo "✅ Updated page title for Margo"

# Run the main serverless deployment
echo ""
echo "🚀 Starting serverless deployment..."
./deploy-serverless.sh "$SUBDOMAIN" "$DOMAIN"

echo ""
echo "✅ Margo's Serverless Baby Raffle Deployment Complete!"
echo ""
echo "🌐 Margo's site is now live at: https://margojones.base2ml.com"
echo "🔐 Admin panel: https://margojones.base2ml.com/admin"
echo ""
echo "📋 Post-deployment checklist for Margo:"
echo "1. ✅ Serverless infrastructure deployed"
echo "2. ✅ Custom configuration applied"
echo "3. 🔄 Update Venmo username in frontend/src/config/margo-config.ts"
echo "4. 🖼️  Upload Margo's personal images to replace:"
echo "   - expecting-couple-baby-shoes.png"
echo "   - beautiful-baby-nursery.png"
echo "   - baby-shower-diapers-gifts.png"
echo "5. 🧪 Test the complete flow end-to-end"
echo "6. 📱 Test on mobile devices"
echo "7. 🎉 Share with friends and family!"
echo ""
echo "💰 Cost Benefits (Serverless):"
echo "- Only pay when people use the site"
echo "- Auto-scales from 0 to unlimited users"
echo "- Estimated cost: \$1-5/month for typical baby raffle"
echo "- No server maintenance required"
echo ""
echo "🛡️  Security & Admin:"
echo "- Admin token saved in .env.margojones"
echo "- SSL encryption enabled"
echo "- CORS properly configured"
echo "- Database credentials secured in AWS Secrets Manager"
echo ""
echo "📞 Support:"
echo "- Technical: tech@base2ml.com"
echo "- Margo's event: margo@margojones.base2ml.com"
