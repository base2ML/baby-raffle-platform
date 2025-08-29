# 🎨 Pinegrow Setup Instructions

## 🚀 **You Can Now Edit Your Frontend Visually in Pinegrow!**

I've created a complete Pinegrow-friendly version of your baby raffle website that you can edit visually.

## 📁 **What's Included**

```
pinegrow-version/
├── index.html           # Landing page (fully functional)
├── betting.html         # Betting page (fully functional)
├── css/
│   └── styles.css       # Custom styles + Tailwind utilities
├── js/
│   ├── slideshow.js     # Slideshow functionality
│   ├── betting.js       # Betting form logic
│   └── main.js          # General functionality
└── images/              # All your slideshow images
```

## 🎯 **Opening in Pinegrow**

### **Step 1: Open Project**
1. Launch Pinegrow
2. Choose **"Open Project"**
3. Navigate to: `serverless-baby-raffle/pinegrow-version/`
4. Select the folder and open

### **Step 2: Configure Framework**
1. In Pinegrow, go to **Project Settings**
2. Set **CSS Framework**: **Tailwind CSS**
3. Enable **Live Preview**
4. Set **Preview URL**: Use built-in server

### **Step 3: Start Editing**
1. Open `index.html` in Pinegrow
2. Use visual editor to modify layouts
3. See changes in real-time
4. Export when ready

## ✨ **What You Can Edit Visually**

### **🎨 Easy Visual Editing:**
- **Hero section**: Change text, colors, backgrounds
- **Slideshow**: Replace images, adjust timing
- **Layout sections**: Rearrange, resize, add/remove
- **Colors & fonts**: Visual color picker, font selector
- **Spacing**: Visual padding/margin adjustments
- **Buttons**: Style, colors, hover effects
- **Cards**: Layouts, shadows, borders
- **Responsive design**: Visual breakpoint editing

### **📱 Perfect for Mobile:**
- Responsive preview modes
- Touch-friendly interface testing
- Mobile-first design tools
- Breakpoint visual editing

## 🛠 **Pinegrow Features You Can Use**

### **Visual Components:**
- Drag & drop elements
- Component library access
- Visual flex/grid editing
- Typography controls
- Color palette management

### **Tailwind Integration:**
- Visual Tailwind class editor
- Utility class suggestions
- Responsive utilities
- Custom CSS integration

### **Live Preview:**
- Real-time changes
- Multi-device preview
- Interactive elements testing
- Performance monitoring

## 🔄 **Workflow: Pinegrow → React**

### **1. Design in Pinegrow**
- Open `pinegrow-version/index.html`
- Make your visual changes
- Test responsive behavior
- Export your changes

### **2. Sync to React**
- Copy updated HTML structure
- Extract new CSS classes
- Update React components
- Test functionality

### **3. Deploy**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://margojones-base2ml-com-baby-raffle --delete
aws cloudfront create-invalidation --distribution-id ERMQR087RJQMW --paths "/*"
```

## 🎨 **Common Visual Tasks**

### **Change Hero Text:**
1. Open `index.html` in Pinegrow
2. Click on hero heading
3. Edit text directly
4. Adjust font size/color visually

### **Replace Slideshow Images:**
1. Add new images to `images/` folder
2. Click on slideshow container
3. Update image sources
4. Adjust alt text

### **Modify Colors:**
1. Select any element
2. Use Pinegrow's color picker
3. Changes apply automatically
4. Export when satisfied

### **Adjust Layout:**
1. Use visual layout tools
2. Drag elements to reposition
3. Adjust spacing with visual controls
4. Preview on different screen sizes

## 📝 **Content Management**

### **Static Content (Edit in Pinegrow):**
- Headlines and descriptions
- Button text and links
- Section layouts and styling
- Image replacements
- Color schemes

### **Dynamic Content (Edit in Config Files):**
- Event details and names
- Betting categories
- Payment information
- API endpoints

## 🚀 **Quick Start Example**

### **Change the Hero Section:**
1. Open `pinegrow-version/index.html` in Pinegrow
2. Click on the main headline
3. Change text to your names: "Welcome to [Your Names]'s Baby Raffle!"
4. Use color picker to change background colors
5. Adjust text sizing with visual sliders
6. Preview on mobile/tablet/desktop
7. Export changes
8. Copy HTML structure to React components

### **Add New Slideshow Images:**
1. Copy your photos to `pinegrow-version/images/`
2. In Pinegrow, select slideshow container
3. Add new slide divs
4. Update image sources
5. Test slideshow functionality
6. Copy changes to React version

## 🛠 **Advanced Features**

### **Custom Components:**
- Create reusable components in Pinegrow
- Export as HTML templates
- Convert to React components
- Maintain design consistency

### **Animation & Interactions:**
- Visual CSS animation editor
- Hover state management
- Transition controls
- Interactive preview

### **Performance:**
- Image optimization tools
- CSS optimization
- Load time analysis
- Mobile performance testing

## 🎯 **Pro Tips**

### **Efficient Workflow:**
1. **Design first**: Use Pinegrow for major layout changes
2. **Iterate quickly**: Real-time preview saves time
3. **Test early**: Use responsive preview modes
4. **Export smart**: Only sync necessary changes to React

### **Best Practices:**
- Keep original React version as backup
- Test both versions before deploying
- Use version control for major changes
- Document your customizations

## 🆘 **Troubleshooting**

### **Pinegrow Not Loading Styles:**
- Ensure Tailwind CDN is working
- Check custom CSS file paths
- Verify project structure

### **Changes Not Syncing:**
- Compare HTML structure carefully
- Ensure Tailwind classes are correct
- Test React version locally first

### **Responsive Issues:**
- Use Pinegrow's device preview
- Test breakpoints individually
- Check mobile-specific styles

## 🎉 **You're Ready!**

Your Pinegrow-friendly version is complete and fully functional:
- ✅ Visual slideshow editing
- ✅ Layout customization
- ✅ Color & typography control
- ✅ Responsive design tools
- ✅ Component-based editing
- ✅ Real-time preview

**Open `pinegrow-version/index.html` in Pinegrow and start designing!** 🎨

The visual editor will give you complete control over your baby raffle website's appearance while maintaining all the functionality.
