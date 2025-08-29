# 🍼 Baby Raffle Framework - Complete User Guide

## 🌟 Welcome to Your Baby Raffle Website!

This guide will help you manage your serverless baby raffle website, add photos to share your journey, and customize everything for your special event.

**Your Live Website**: https://margojones.base2ml.com

---

## 📸 Managing Your Slideshow (The Heart of Your Site)

### 🎯 **Dynamic Slideshow System - RECOMMENDED**

Your slideshow now **automatically cycles through photos in a folder**! No coding required - just upload photos and they appear.

#### **How It Works**
```
📁 Your S3 Bucket: margojones-base2ml-com-baby-raffle/
├── slideshow/                           ← Your photos go here!
│   ├── slideshow-manifest.json         ← Controls captions & dates
│   ├── expecting-couple-baby-shoes.png ← Current photos
│   ├── beautiful-baby-nursery.png      
│   ├── baby-shower-diapers-gifts.png   
│   ├── ultrasound-12-weeks.jpg         ← Add new photos here!
│   ├── maternity-photo.jpg             ← Automatically included!
│   └── nursery-progress.png            ← Updates shown instantly!
└── (other website files)
```

#### **🚀 Adding New Photos - 3 Easy Methods**

**Method 1: Quick Upload (Just Photos)**
```bash
# Photos appear automatically with default captions
aws s3 cp your-ultrasound.jpg s3://margojones-base2ml-com-baby-raffle/slideshow/
aws s3 cp maternity-shoot.jpg s3://margojones-base2ml-com-baby-raffle/slideshow/
aws s3 cp nursery-update.png s3://margojones-base2ml-com-baby-raffle/slideshow/
```

**Method 2: With Custom Captions**
1. Upload your photo:
   ```bash
   aws s3 cp 20-week-ultrasound.jpg s3://margojones-base2ml-com-baby-raffle/slideshow/
   ```

2. Download and edit the manifest:
   ```bash
   aws s3 cp s3://margojones-base2ml-com-baby-raffle/slideshow/slideshow-manifest.json .
   ```

3. Add your photo info to the manifest:
   ```json
   {
     "images": [
       {
         "filename": "20-week-ultrasound.jpg",
         "caption": "20 Weeks - Baby is Growing!",
         "subtitle": "Look at those tiny fingers!",
         "date": "2024-08-27",
         "alt": "20-week ultrasound showing baby development"
       }
     ]
   }
   ```

4. Upload the updated manifest:
   ```bash
   aws s3 cp slideshow-manifest.json s3://margojones-base2ml-com-baby-raffle/slideshow/
   ```

**Method 3: Batch Upload Multiple Photos**
```bash
# Upload entire folders at once
aws s3 cp ultrasound-photos/ s3://margojones-base2ml-com-baby-raffle/slideshow/ --recursive
aws s3 cp maternity-photos/ s3://margojones-base2ml-com-baby-raffle/slideshow/ --recursive
```

#### **📝 Perfect Photos for Your Journey**

**📅 Early Pregnancy (6-12 weeks)**
- Positive pregnancy test
- First ultrasound
- Announcement photos

**📅 Second Trimester (13-27 weeks)**
- Anatomy scan photos
- Gender reveal moments
- Growing bump photos
- Nursery planning

**📅 Third Trimester (28-40 weeks)**
- Maternity photoshoot
- Completed nursery
- Final ultrasounds
- Ready-to-meet moments

**📅 Ongoing Updates**
- Baby shower preparations
- Gift reveals
- Weekly bump progression
- Countdown moments

---

## 🎨 **Visual Design Editing (Pinegrow)**

### **🖼️ Want to Edit Visually? Use Pinegrow!**

For visual design changes, you can use the **Pinegrow-friendly version** I've created:

**📁 Location**: `pinegrow-version/` folder
**📖 Instructions**: See [PINEGROW_SETUP.md](PINEGROW_SETUP.md) for complete setup

**What you can edit visually:**
- ✅ **Layouts**: Drag & drop section rearrangement
- ✅ **Colors**: Visual color picker for all elements
- ✅ **Typography**: Font selection and sizing
- ✅ **Images**: Replace slideshow photos easily
- ✅ **Spacing**: Visual margin/padding adjustments
- ✅ **Responsive**: Multi-device preview and editing

**Workflow:**
1. Open `pinegrow-version/` in Pinegrow
2. Make visual changes using the visual editor
3. Export your changes
4. Sync to your React version
5. Deploy normally

**Perfect for:** Layout changes, color schemes, typography, image replacement, responsive design

---

## ⚙️ Website Configuration

### 🎨 **Customizing Your Event Details (Code)**

Edit the file: `serverless-baby-raffle/frontend/src/config/margo-config.ts`

```typescript
export const margoConfig: AppConfig = {
  event: {
    parentNames: "Your Names Here",
    eventTitle: "Welcome to Our Baby Raffle!",
    eventSubtitle: "Help us celebrate our little miracle on the way",
    welcomeMessage: "Join us in this exciting journey!",
    footerMessage: "Thank you for being part of our journey!"
  },
  
  betting: {
    pricePerBet: 5.00,        // Cost per bet
    winnerPercentage: 0.5,    // Winner gets 50% of pot
    currency: "USD",
    categories: [
      // Add/edit betting categories here
    ]
  },
  
  payment: {
    venmoUsername: "@Your-Venmo",
    paymentInstructions: "Send your bet amount via Venmo!",
    paymentNote: "Include your name and 'Baby Raffle' in the note"
  },
  
  social: {
    shareTitle: "Join Our Baby Raffle!",
    shareText: "I'm placing bets in our baby raffle!",
    shareTextExpanded: "Come make predictions about our little one!"
  },
  
  admin: {
    adminTitle: "Your Baby Raffle Admin",
    supportEmail: "your-email@domain.com"
  }
};
```

### 🎲 **Adding/Editing Betting Categories**

In the same config file, customize the betting categories:

```typescript
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
  // Add more categories as needed
]
```

---

## 🚀 Deploying Your Changes

### **After Making Configuration Changes**

1. **Build the updated website:**
   ```bash
   cd serverless-baby-raffle/frontend
   npm run build
   ```

2. **Deploy to your website:**
   ```bash
   aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete
   ```

3. **Clear the cache (important!):**
   ```bash
   aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"
   ```

4. **Your changes are live within 1-2 minutes!**

### **Quick Deploy Script**
Create a file called `quick-deploy.sh`:
```bash
#!/bin/bash
cd serverless-baby-raffle/frontend
npm run build
aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete
aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"
echo "✅ Website updated successfully!"
```

Make it executable: `chmod +x quick-deploy.sh`
Run it: `./quick-deploy.sh`

---

## 🎯 Managing Your Baby Raffle

### 📊 **Admin Panel**
Access your admin panel at: https://margojones.base2ml.com/admin

**Features:**
- View all bets placed
- See category totals
- Validate payments
- Track raffle progress

### 💰 **Payment Workflow**
1. Users place bets on your website
2. They pay via Venmo using your username
3. You validate payments in the admin panel
4. Validated bets count toward the prize pool

### 🏆 **Determining Winners**
- Admin panel shows all bets by category
- Export data for random drawing
- Winner gets the configured percentage of total pot

---

## 🛠 Image Management Best Practices

### **📐 Recommended Image Specs**
- **Resolution**: 1920x1080 (1080p) or higher
- **Aspect Ratio**: 16:9 works best for full-screen display
- **Format**: JPG for photos, PNG for graphics with transparency
- **File Size**: Keep under 2MB each for fast loading

### **🎨 Image Optimization Tips**
1. **Compress images** before upload using tools like TinyPNG
2. **Use descriptive filenames**: `ultrasound-20-weeks.jpg` vs `IMG_1234.jpg`
3. **Date your photos**: Include dates for chronological ordering
4. **Backup originals**: Keep high-res versions safe

### **📱 Mobile-Friendly**
Your slideshow automatically:
- Adapts to all screen sizes
- Loads efficiently on mobile
- Provides touch-friendly navigation
- Shows optimized images for each device

---

## 🔧 Troubleshooting

### **🖼️ Slideshow Issues**

**Photos not showing?**
1. Check file paths - ensure photos are in `/slideshow/` folder
2. Verify file names match exactly (case-sensitive)
3. Run CloudFront invalidation after uploading
4. Wait 1-2 minutes for cache to clear

**Slow loading?**
1. Compress images to under 2MB each
2. Use JPG format for photos
3. Check your internet connection
4. Clear browser cache

### **⚙️ Configuration Issues**

**Changes not appearing?**
1. Run the full deploy process (build → upload → invalidate)
2. Clear your browser cache
3. Check CloudFront invalidation status
4. Verify files uploaded correctly to S3

**Website errors?**
1. Check browser console for JavaScript errors
2. Verify all configuration syntax is correct
3. Ensure all required fields are filled
4. Contact support if issues persist

### **💳 Payment Issues**

**Venmo not working?**
1. Double-check your Venmo username in config
2. Make sure Venmo account is public/accepts payments
3. Test with a small payment yourself
4. Update payment instructions if needed

---

## 📱 Sharing Your Baby Raffle

### **🌐 Social Media**
Built-in sharing features let visitors share your raffle on:
- Facebook
- Twitter
- Instagram
- Email
- Text messaging

### **📧 Direct Invitations**
Send friends the link: https://margojones.base2ml.com

Include messaging like:
> "Join our baby raffle! Make predictions about our little one and win prizes. $5 per bet, winner takes 50% of the pot! 🍼"

### **📱 QR Code**
Generate a QR code for your website URL to include on:
- Baby shower invitations
- Social media posts
- Physical flyers
- Thank you cards

---

## 📋 Quick Reference

### **🔗 Important Links**
- **Your Website**: https://margojones.base2ml.com
- **Admin Panel**: https://margojones.base2ml.com/admin
- **S3 Bucket**: margojones-base2ml-com-baby-raffle
- **CloudFront Distribution**: ERMQR087RJQMW

### **📁 Key Files**
- **Config**: `frontend/src/config/margo-config.ts`
- **Slideshow**: Upload to `slideshow/` folder in S3
- **Manifest**: `slideshow/slideshow-manifest.json`

### **⚡ Quick Commands**
```bash
# Upload new slideshow photo
aws s3 cp photo.jpg s3://margojones-base2ml-com-baby-raffle/slideshow/

# Deploy website changes
cd frontend && npm run build && aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete

# Clear cache
aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"
```

---

## 🎉 You're All Set!

Your baby raffle website is now fully configured and ready to share your pregnancy journey with friends and family! 

**Key Features:**
- ✅ Dynamic slideshow that grows with your journey
- ✅ Automated betting system with payment validation
- ✅ Mobile-responsive design
- ✅ Social sharing capabilities
- ✅ Easy content management
- ✅ Secure AWS hosting

**Need Help?**
- Check the troubleshooting section above
- Review the specific guides in this folder
- Contact support if you encounter issues

**Enjoy sharing your beautiful baby journey! 🍼✨**

---

*This framework was built with ❤️ for sharing the joy of expecting parents everywhere.*
