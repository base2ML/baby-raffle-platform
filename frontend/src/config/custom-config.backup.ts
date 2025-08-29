import { AppConfig } from './app-config';

// Margo Jones Baby Raffle Configuration
export const margoConfig: AppConfig = {
  event: {
    parentNames: "Margo & Partner",
    eventTitle: "Welcome Margo's Baby Raffle!",
    eventSubtitle: "Help us celebrate our little miracle on the way",
    welcomeMessage: "Join us in this exciting journey as we prepare to welcome our little one!",
    footerMessage: "Thank you for being part of our journey. We can't wait to meet our little miracle!"
  },
  
  betting: {
    pricePerBet: 5.00,
    winnerPercentage: 0.5,
    currency: "USD",
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
      {
        categoryKey: "birth_length",
        displayName: "Birth Length",
        description: "How long will baby be?",
        placeholder: "e.g., 20 inches"
      },
      {
        categoryKey: "gender",
        displayName: "Gender",
        description: "What will baby be?",
        placeholder: "Boy or Girl"
      },
      {
        categoryKey: "eye_color",
        displayName: "Eye Color",
        description: "What color eyes will baby have?",
        placeholder: "e.g., Brown, Blue, Green, Hazel"
      },
      {
        categoryKey: "hair_color",
        displayName: "Hair Color",
        description: "What color hair will baby have?",
        placeholder: "e.g., Blonde, Brown, Black, Red"
      },
      {
        categoryKey: "looks_like",
        displayName: "Family Resemblance",
        description: "Who will baby look like more?",
        placeholder: "Margo, Partner, or Perfect mix"
      },
      {
        categoryKey: "first_word",
        displayName: "First Word",
        description: "What will baby's first word be?",
        placeholder: "e.g., Mama, Dada, Hi"
      }
    ]
  },
  
  payment: {
    venmoUsername: "@Margo-Jones", // This should be updated with actual Venmo username
    paymentInstructions: "Send your bet amount via Venmo to complete your entry!",
    paymentNote: "Include your name and 'Baby Raffle' in the Venmo note. Your bets will be verified once payment is received."
  },
  
  social: {
    shareTitle: "Join Margo's Baby Raffle!",
    shareText: "I'm placing bets in Margo's baby raffle! Join me and guess details about her little one. $5 per bet, winner takes 50% of the pot!",
    shareTextExpanded: "I'm joining Margo's baby raffle! Come make predictions about her little one's arrival with me. $5 per bet and amazing prizes await the best guessers!"
  },
  
  images: {
    slideshow: [
      {
        src: "/expecting-couple-baby-shoes.png",
        caption: "Welcome to Margo's Baby Journey!",
        subtitle: "Join us in celebrating this magical time",
        alt: "Expecting parents with baby shoes"
      },
      {
        src: "/beautiful-baby-nursery.png", 
        caption: "The Nursery is Ready & Waiting!",
        subtitle: "Every detail prepared with love and excitement",
        alt: "Beautiful baby nursery ready for arrival"
      },
      {
        src: "/baby-shower-diapers-gifts.png",
        caption: "Join Our Baby Raffle & Make Your Predictions!",
        subtitle: "Fun prizes and excitement await the winners",
        alt: "Baby shower celebration with gifts and surprises"
      }
    ]
  },
  
  admin: {
    adminTitle: "Margo's Baby Raffle Admin",
    supportEmail: "margo@margojones.base2ml.com"
  }
};

// Export as default for easy importing
export default margoConfig;
