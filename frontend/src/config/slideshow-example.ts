// 📸 SLIDESHOW CONFIGURATION EXAMPLE
// Copy this configuration into your margo-config.ts file

images: {
  slideshow: [
    // Slide 1: Pregnancy Announcement
    {
      src: "/expecting-couple-baby-shoes.png",  // ✅ Image already in public/
      caption: "Our Greatest Adventure Begins!",
      subtitle: "Baby [Last Name] arriving [Due Date]",
      alt: "Expecting couple holding baby shoes"
    },
    
    // Slide 2: Nursery Setup
    {
      src: "/beautiful-baby-nursery.png",       // ✅ Image already in public/
      caption: "The Nursery is Ready!",
      subtitle: "Every detail chosen with love and care",
      alt: "Beautiful baby nursery with crib and decorations"
    },
    
    // Slide 3: Baby Raffle Call-to-Action
    {
      src: "/baby-shower-diapers-gifts.png",   // ✅ Image already in public/
      caption: "Join Our Baby Raffle!",
      subtitle: "Make your predictions and win amazing prizes",
      alt: "Baby shower celebration with gifts and decorations"
    }
    
    // 🎯 ADD YOUR OWN SLIDES HERE:
    /*
    {
      src: "/your-maternity-photo.jpg",        // Add your own image
      caption: "30 Weeks and Glowing!",
      subtitle: "Can't wait to meet our little miracle",
      alt: "Maternity photo of expecting parents"
    },
    {
      src: "/ultrasound-photo.jpg",
      caption: "First Glimpse of Baby!",
      subtitle: "Our hearts are already so full of love",
      alt: "Ultrasound image showing baby"
    },
    {
      src: "/gender-reveal.jpg",
      caption: "It's a [Boy/Girl]!",
      subtitle: "Pink or blue, we love you!",
      alt: "Gender reveal celebration moment"
    }
    */
  ]
}

/*
🚀 QUICK STEPS TO ADD YOUR OWN IMAGES:

1. Add your images to: serverless-baby-raffle/frontend/public/
   - your-photo.jpg
   - another-photo.png
   - etc.

2. Update this configuration in margo-config.ts with your image paths

3. Rebuild and deploy:
   cd serverless-baby-raffle/frontend
   npm run build
   aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete
   aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"

📝 IMAGE TIPS:
- Use 1920x1080 resolution for best quality
- Keep files under 2MB each
- JPG for photos, PNG for graphics with transparency
- Choose images that tell your story!

🎨 CAPTION IDEAS:
- "Our Journey to Parenthood"
- "Baby [Name] Coming [Month] 2024"
- "The Adventure of a Lifetime Begins"
- "From Two Hearts to Three"
- "Our Little Miracle on the Way"
*/
