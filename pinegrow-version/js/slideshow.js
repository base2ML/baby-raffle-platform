// Slideshow functionality for Pinegrow version
class Slideshow {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.totalSlides = this.slides.length;
        
        this.init();
    }
    
    init() {
        // Auto-advance slides every 5 seconds
        this.autoAdvance = setInterval(() => {
            this.nextSlide();
        }, 5000);
        
        // Navigation button events
        document.getElementById('prev-slide')?.addEventListener('click', () => {
            this.prevSlide();
        });
        
        document.getElementById('next-slide')?.addEventListener('click', () => {
            this.nextSlide();
        });
        
        // Indicator events
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });
        
        // Pause on hover
        const container = document.getElementById('slideshow-container');
        container?.addEventListener('mouseenter', () => {
            clearInterval(this.autoAdvance);
        });
        
        container?.addEventListener('mouseleave', () => {
            this.autoAdvance = setInterval(() => {
                this.nextSlide();
            }, 5000);
        });
    }
    
    showSlide(n) {
        // Hide all slides
        this.slides.forEach(slide => {
            slide.classList.remove('opacity-100');
            slide.classList.add('opacity-0');
        });
        
        // Show current slide
        if (this.slides[n]) {
            this.slides[n].classList.remove('opacity-0');
            this.slides[n].classList.add('opacity-100');
        }
        
        // Update indicators
        this.indicators.forEach((indicator, index) => {
            if (index === n) {
                indicator.classList.remove('bg-white/50');
                indicator.classList.add('bg-white');
            } else {
                indicator.classList.remove('bg-white');
                indicator.classList.add('bg-white/50');
            }
        });
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.showSlide(this.currentSlide);
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.showSlide(this.currentSlide);
    }
    
    goToSlide(n) {
        this.currentSlide = n;
        this.showSlide(this.currentSlide);
    }
}

// Initialize slideshow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Slideshow();
});
