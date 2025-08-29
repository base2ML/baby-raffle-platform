# 📸 How to Add Images to the Slideshow

## Quick Overview
The slideshow is configured in your config file and displays images from the `public` directory. Each slide can have a caption, subtitle, and alt text.

## 📁 Directory Structure
```
serverless-baby-raffle/frontend/
├── public/                    <- Put your images here
│   ├── image1.jpg
│   ├── image2.png
│   └── image3.jpg
└── src/config/
    └── margo-config.ts       <- Configure slideshow here
```

## 🚀 Step-by-Step Instructions

### Step 1: Add Your Images to the Public Directory
```bash
# Place your images in the public directory
cp your-photo1.jpg serverless-baby-raffle/frontend/public/
cp your-photo2.png serverless-baby-raffle/frontend/public/
cp your-photo3.jpg serverless-baby-raffle/frontend/public/
```

### Step 2: Update the Configuration File
Edit `serverless-baby-raffle/frontend/src/config/margo-config.ts`:

```typescript
images: {
  slideshow: [
    {
      src: "/your-photo1.jpg",                    // Path from public directory
      caption: "Our Journey Begins!",             // Main text overlay
      subtitle: "Excited to meet our little one", // Secondary text
      alt: "Couple holding ultrasound photo"      // Accessibility text
    },
    {
      src: "/your-photo2.png",
      caption: "Baby's Room is Ready!",
      subtitle: "Every detail prepared with love",
      alt: "Beautiful nursery setup"
    },
    {
      src: "/your-photo3.jpg",
      caption: "Join Our Baby Raffle!",
      subtitle: "Make your predictions and win prizes",
      alt: "Baby shower celebration"
    }
    // Add as many slides as you want!
  ]
}
```

### Step 3: Rebuild and Deploy
```bash
cd serverless-baby-raffle/frontend
npm run build
aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete
aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"
```

## 🎨 Image Recommendations

### Size & Format
- **Resolution**: 1920x1080 (1080p) or higher for best quality
- **Aspect Ratio**: 16:9 works best for full-screen display
- **Format**: JPG, PNG, or WebP
- **File Size**: Keep under 2MB each for fast loading

### Content Ideas
- Maternity photos
- Nursery/baby room setup
- Ultrasound images
- Family photos
- Baby shower moments
- Gender reveal photos
- Milestone pregnancy photos

## 🛠 Advanced Customization

### Slide Timing
The slideshow auto-advances every 5 seconds. To change this, edit `LandingPage.tsx`:
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % slideImages.length)
  }, 8000) // Change 5000 to 8000 for 8 seconds
  return () => clearInterval(timer)
}, [slideImages.length])
```

### Caption Styling
The captions are styled with Tailwind CSS classes. You can customize the appearance in `LandingPage.tsx`.

### Image Optimization
For better performance, consider:
- Compressing images before upload
- Using WebP format for smaller file sizes
- Providing multiple sizes for responsive design

## 🔧 Troubleshooting

### Images Not Showing?
1. **Check file paths**: Ensure the `src` starts with `/` and matches the filename exactly
2. **Case sensitivity**: File names are case-sensitive (image.jpg ≠ Image.JPG)
3. **File permissions**: Make sure images are readable
4. **Clear cache**: Run CloudFront invalidation after deploying

### Slow Loading?
1. **Compress images**: Use tools like TinyPNG or ImageOptim
2. **Reduce file size**: Keep images under 1-2MB each
3. **Use appropriate format**: JPG for photos, PNG for graphics with transparency

## 📝 Example Complete Configuration

```typescript
images: {
  slideshow: [
    {
      src: "/maternity-photo.jpg",
      caption: "Our Beautiful Journey",
      subtitle: "30 weeks and counting!",
      alt: "Maternity photo of expecting parents"
    },
    {
      src: "/nursery-ready.jpg", 
      caption: "The Nursery Awaits",
      subtitle: "Every detail chosen with love",
      alt: "Completed baby nursery with crib and decorations"
    },
    {
      src: "/ultrasound-reveal.jpg",
      caption: "First Glimpse of Baby",
      subtitle: "Our hearts are already full",
      alt: "Ultrasound image showing baby"
    },
    {
      src: "/baby-shower-setup.jpg",
      caption: "Celebration Time!",
      subtitle: "Join us for the baby raffle",
      alt: "Baby shower decorations and gift table"
    }
  ]
}
```

## 🎯 Quick Checklist
- [ ] Images added to `public/` directory
- [ ] Configuration updated in `margo-config.ts`
- [ ] Built and deployed frontend
- [ ] CloudFront cache invalidated
- [ ] Tested slideshow functionality

Your slideshow will automatically cycle through all configured images with smooth transitions and navigation controls!
