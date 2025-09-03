# 📸 How to Change Background Slideshow Images

## Method 1: Replace Existing Images (Easiest)

1. **Replace these files** in `frontend/public/slideshow/`:
   - `expecting-couple-baby-shoes.png`
   - `beautiful-baby-nursery.png`
   - `baby-shower-diapers-gifts.png`

2. **Keep the same filenames** - the slideshow will automatically use your new images

3. **Deploy your changes**:
   ```bash
   ./update.sh
   ```

## Method 2: Add New Images + Update Config

1. **Add your new images** to `frontend/public/slideshow/`

2. **Edit** `frontend/public/slideshow/3242.json`:
   ```json
   {
     "images": [
       {
         "filename": "your-new-image1.jpg",
         "caption": "Your Custom Caption",
         "subtitle": "Your custom subtitle",
         "date": "2024-08-01",
         "alt": "Description for accessibility"
       },
       {
         "filename": "your-new-image2.jpg", 
         "caption": "Another Caption",
         "subtitle": "Another subtitle",
         "date": "2024-08-15",
         "alt": "Another description"
       }
     ]
   }
   ```

3. **Deploy your changes**:
   ```bash
   ./update.sh
   ```

## Image Requirements:
- **Format**: JPG, PNG, or WebP
- **Size**: Recommended 1920x1080 or similar wide aspect ratio
- **Location**: Must be in `frontend/public/slideshow/`

## Quick Test:
- **Local preview**: `./dev.sh` then visit http://localhost:5173
- **Deploy live**: `./update.sh`

Your new images will appear as the rotating background slideshow!