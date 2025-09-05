# 🌐 DNS Configuration for Custom Domains

## Current Vercel Deployments:
- **Marketing Site**: https://baby-raffle-marketing-9lhbimjuo-slimhindrances-projects.vercel.app
- **Site Builder**: https://baby-raffle-builder-hivagvvpb-slimhindrances-projects.vercel.app

## Target Custom Domains:
- **Marketing**: `babyraffle.base2ml.com`
- **Builder**: `babyrafflebuilder.base2ml.com`

## DNS Configuration Steps:

### 1. Add DNS Records to base2ml.com

In your DNS provider (where base2ml.com is hosted), add these CNAME records:

```
Type: CNAME
Name: babyraffle
Value: cname.vercel-dns.com
TTL: 300 (or default)

Type: CNAME  
Name: babyrafflebuilder
Value: cname.vercel-dns.com
TTL: 300 (or default)
```

### 2. Verify Domain Ownership in Vercel

Once DNS records are added, you need to verify domain ownership:

**Marketing Site:**
1. Go to https://vercel.com/dashboard
2. Select `baby-raffle-marketing` project
3. Go to Settings → Domains
4. The domain `babyraffle.base2ml.com` should show as "Pending Verification"
5. Click "Verify" once DNS propagates

**Site Builder:**
1. Add `babyrafflebuilder.base2ml.com` to the `baby-raffle-builder` project
2. Follow same verification process

### 3. Alternative: Use Vercel CLI after DNS setup

```bash
# After DNS records are live:
cd marketing-site
vercel --token=$VERCEL_TOKEN domains add babyraffle.base2ml.com

cd ../site-builder  
vercel --token=$VERCEL_TOKEN domains add babyrafflebuilder.base2ml.com
```

## Quick Test:

Check if DNS is working:
```bash
nslookup babyraffle.base2ml.com
nslookup babyrafflebuilder.base2ml.com
```

## 🚀 After DNS Setup:

Your sites will be live at:
- Marketing: https://babyraffle.base2ml.com
- Builder: https://babyrafflebuilder.base2ml.com

## 📝 Current Status:

✅ **Apps Deployed**: Both apps are live on Vercel
⏳ **DNS Setup Required**: Need to add CNAME records for custom domains
⏳ **Domain Verification**: Vercel needs to verify ownership after DNS setup

Would you like me to help check your current DNS setup or provide more specific instructions based on your DNS provider?