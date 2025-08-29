// Main functionality for Pinegrow version
document.addEventListener('DOMContentLoaded', () => {
    
    // Share functionality
    const shareButton = document.getElementById('share-button');
    shareButton?.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'Join Our Baby Raffle!',
                text: 'Make predictions about our little one and win prizes!',
                url: window.location.href
            });
        } else {
            // Fallback for browsers without native sharing
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard! Share with your friends.');
            });
        }
    });
    
    // Prize pool animation (mock data for design purposes)
    const prizePool = document.getElementById('prize-pool');
    if (prizePool) {
        // Simulate growing prize pool
        let amount = 0;
        const target = 250; // Example target amount
        const increment = 5;
        const speed = 50; // milliseconds
        
        const animateCounter = () => {
            if (amount < target) {
                amount += increment;
                prizePool.textContent = `$${amount}`;
                setTimeout(animateCounter, speed);
            } else {
                prizePool.textContent = `$${target}`;
            }
        };
        
        // Start animation when element comes into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(prizePool);
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll effects
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero-bg');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
});

// Utility functions for Pinegrow editing
window.PinegrowUtils = {
    // Add new slide to slideshow
    addSlide: (imageSrc, caption, subtitle) => {
        const container = document.getElementById('slideshow-container');
        const slideHTML = `
            <div class="slide absolute inset-0 opacity-0 transition-opacity duration-1000">
                <img src="${imageSrc}" alt="${caption}" class="h-full w-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50"></div>
            </div>
        `;
        container?.insertAdjacentHTML('beforeend', slideHTML);
    },
    
    // Update hero text
    updateHeroText: (title, subtitle, description) => {
        const titleEl = document.querySelector('h1');
        const subtitleEl = document.querySelector('h1 + p');
        const descEl = document.querySelector('h1 + p + p');
        
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
        if (descEl) descEl.textContent = description;
    },
    
    // Change color scheme
    updateColors: (primary, secondary) => {
        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--secondary-color', secondary);
    }
};
