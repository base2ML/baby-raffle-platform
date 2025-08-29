import { useState, useEffect } from 'react';

export interface DynamicSlideImage {
  filename: string;
  src: string;
  caption: string;
  subtitle: string;
  date?: string;
  alt: string;
}

export interface SlideshowManifest {
  images: Omit<DynamicSlideImage, 'src'>[];
  autoGenerate: boolean;
  folderPath: string;
  defaultCaption: string;
  defaultSubtitle: string;
}

export function useDynamicSlideshow() {
  const [slideImages, setSlideImages] = useState<DynamicSlideImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSlideshow = async () => {
      try {
        setLoading(true);
        
        // First, try to load the manifest file
        const manifestResponse = await fetch('/slideshow/slideshow-manifest.json');
        
        if (manifestResponse.ok) {
          const manifest: SlideshowManifest = await manifestResponse.json();
          console.log('✅ Slideshow manifest loaded:', manifest);
          
          // Process manifest images
          const processedImages: DynamicSlideImage[] = manifest.images.map(img => ({
            ...img,
            src: `${manifest.folderPath}${img.filename}`
          }));

          console.log('📸 Processed slideshow images:', processedImages);

          // Sort by date if available (newest first for pregnancy journey)
          processedImages.sort((a, b) => {
            if (a.date && b.date) {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            return 0;
          });

          setSlideImages(processedImages);
        } else {
          // Fallback: Try to detect common image files in slideshow folder
          const commonFiles = [
            'slide1.jpg', 'slide2.jpg', 'slide3.jpg',
            'image1.png', 'image2.png', 'image3.png',
            'photo1.jpg', 'photo2.jpg', 'photo3.jpg',
            'ultrasound1.jpg', 'ultrasound2.jpg',
            'maternity1.jpg', 'maternity2.jpg',
            'nursery.jpg', 'announcement.jpg'
          ];

          const detectedImages: DynamicSlideImage[] = [];
          
          // Test each common filename
          for (const filename of commonFiles) {
            try {
              const testResponse = await fetch(`/slideshow/${filename}`, { method: 'HEAD' });
              if (testResponse.ok) {
                detectedImages.push({
                  filename,
                  src: `/slideshow/${filename}`,
                  caption: `Our Baby Journey`,
                  subtitle: `Sharing every precious moment with you`,
                  alt: `Baby journey photo ${filename}`
                });
              }
            } catch {
              // File doesn't exist, continue
            }
          }

          if (detectedImages.length > 0) {
            setSlideImages(detectedImages);
          } else {
            throw new Error('No slideshow images found');
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('❌ Failed to load slideshow:', err);
        setError(err instanceof Error ? err.message : 'Failed to load slideshow');
        console.log('🔄 Falling back to static images...');
        
        // Fallback to static images from root
        setSlideImages([
          {
            filename: 'expecting-couple-baby-shoes.png',
            src: '/expecting-couple-baby-shoes.png',
            caption: 'Our Greatest Adventure Begins!',
            subtitle: 'Join us in celebrating this magical time',
            alt: 'Expecting parents with baby shoes'
          },
          {
            filename: 'beautiful-baby-nursery.png',
            src: '/beautiful-baby-nursery.png',
            caption: 'The Nursery is Ready & Waiting!',
            subtitle: 'Every detail prepared with love and excitement',
            alt: 'Beautiful baby nursery ready for arrival'
          },
          {
            filename: 'baby-shower-diapers-gifts.png',
            src: '/baby-shower-diapers-gifts.png',
            caption: 'Join Our Baby Raffle!',
            subtitle: 'Make your predictions and win amazing prizes',
            alt: 'Baby shower celebration with gifts and surprises'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadSlideshow();
  }, []);

  return { slideImages, loading, error };
}
