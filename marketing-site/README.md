# Baby Raffle Marketing Site

A modern, conversion-focused marketing website for the Baby Raffle SaaS platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Design**: Beautiful, mobile-first design with smooth animations
- **SEO Optimized**: Meta tags, structured data, and performance optimized
- **Responsive**: Works perfectly on all devices and screen sizes
- **Fast Loading**: Optimized images, fonts, and assets for quick load times
- **Accessibility**: WCAG compliant with keyboard navigation and screen readers
- **OAuth Integration**: Seamless signup flow with Google and GitHub
- **Interactive Components**: Engaging UI with hover effects and animations

## 📄 Pages & Sections

1. **Hero Section**: Compelling headline with value proposition and CTA
2. **Features Section**: Key platform benefits and capabilities
3. **Gallery Section**: Showcase of example baby raffle sites
4. **Pricing Section**: Clear, transparent pricing with plan comparison
5. **How It Works**: Step-by-step process explanation
6. **Get Started**: Signup form with OAuth integration
7. **Footer**: Links, support, and company information

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Animations**: CSS animations and transitions
- **Authentication**: OAuth integration with existing backend

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to the Baby Raffle API endpoints

### Installation

1. Navigate to the marketing site directory:
```bash
cd marketing-site
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=https://api.base2ml.com
NEXT_PUBLIC_SITE_URL=https://mybabyraffle.base2ml.com
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm run start
```

### Static Export

For static hosting:
```bash
npm run export
```

## 🎨 Customization

### Colors & Branding

The site uses a gradient color scheme from pink to purple. To customize:

1. Update CSS custom properties in `src/app/globals.css`
2. Modify Tailwind configuration in `tailwind.config.js`
3. Update logo and brand assets in the `public/` directory

### Content

- **Copy**: Update text content in component files
- **Images**: Replace placeholder images in `public/` directory
- **SEO**: Modify metadata in `src/app/layout.tsx`

### Components

All components are in `src/components/`:
- `Navigation.tsx` - Site navigation and mobile menu
- `HeroSection.tsx` - Main hero with CTA
- `FeaturesSection.tsx` - Features grid
- `GallerySection.tsx` - Example sites showcase
- `PricingSection.tsx` - Pricing plans and FAQ
- `HowItWorksSection.tsx` - Process explanation
- `GetStartedSection.tsx` - Signup form
- `Footer.tsx` - Site footer

### Styling

- Global styles: `src/app/globals.css`
- Component styles: Tailwind classes with custom utilities
- UI components: `src/components/ui/` directory

## 🔗 Integration

### OAuth Flow

The site integrates with the existing FastAPI backend OAuth system:

1. User fills out the signup form
2. Form data is stored in session storage
3. User is redirected to OAuth provider
4. After authentication, they're redirected back to the app
5. Backend creates tenant and user accounts

### API Endpoints

- `POST /api/auth/login` - OAuth login initiation
- `POST /api/auth/callback` - OAuth callback handling
- `GET /api/tenant/validate-subdomain/{subdomain}` - Subdomain availability
- `POST /api/tenant/create` - Tenant creation

## 📊 Performance

- **Core Web Vitals**: Optimized for excellent scores
- **Image Optimization**: Next.js Image component with optimization
- **Bundle Size**: Tree shaking and code splitting
- **Loading Speed**: Optimized fonts and assets
- **SEO**: Perfect Lighthouse SEO score

## 🎯 Conversion Optimization

- **Clear Value Proposition**: Emotional, benefit-focused messaging
- **Social Proof**: Customer testimonials and usage statistics
- **Multiple CTAs**: Strategic placement throughout the site
- **Urgency**: Limited-time offers and scarcity indicators
- **Trust Signals**: Security badges, guarantees, and testimonials
- **Friction Reduction**: Simple signup process with OAuth

## 📱 Mobile Experience

- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Touch Friendly**: Large tap targets and gestures
- **Fast Loading**: Optimized for mobile networks
- **Responsive Images**: Proper sizing for all screen densities
- **Accessible**: Works with mobile assistive technologies

## 🔒 Security & Privacy

- **HTTPS**: Secure connections throughout
- **Privacy**: Clear privacy policy and data handling
- **OAuth Security**: Secure authentication flow
- **No Tracking**: Minimal analytics and tracking
- **GDPR Compliant**: Proper consent and data handling

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Other Platforms

The site can be deployed to any static hosting provider:
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Firebase Hosting

## 📈 Analytics & Monitoring

Add your preferred analytics:
- Google Analytics 4
- Plausible Analytics
- Vercel Analytics
- Custom event tracking

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Test on multiple devices and browsers
3. Optimize for accessibility and performance
4. Update documentation for new features

## 📞 Support

For questions or issues:
- Email: support@base2ml.com
- Documentation: This README
- API Documentation: See backend README

## 📄 License

Private project - All rights reserved.