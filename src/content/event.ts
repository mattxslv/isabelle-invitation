// Single source of truth for event facts and invitation copy.
// Edit here; components only render what this file says.
// House rule: no em dashes in guest-facing copy.

export const TIMEZONE = "Asia/Manila";

export const event = {
  celebrant: {
    fullName: "Khloe Isabelle G. Avilanes",
    displayFirst: "Khloe Isabelle",
    displayLast: "G. Avilanes",
    shortName: "Isabelle",
  },
  title: "First Birthday & Christening Celebration",
  dateLabel: "Tuesday, November 17, 2026",
  weekday: "Tuesday",
  dateLong: "November 17, 2026",
  // Countdown target: start of the christening, Philippine time.
  startsAt: "2026-11-17T11:00:00+08:00",
  // After this moment the hero thanks guests instead of counting down.
  endsAt: "2026-11-17T23:59:59+08:00",
  tagline: "A little faith, a lot of love, and a lifetime of blessings.",

  christening: {
    heading: "A Blessed Beginning",
    text: "With grateful hearts, we invite you to witness a beautiful milestone as our little Isabelle receives the blessing of baptism.",
    label: "Christening Ceremony",
    time: "11:00 AM",
    venue: "St. Michael The Archangel Parish",
    address: "Brgy. San Miguel, Tarlac City, Tarlac",
    map: {
      // PROVISIONAL text search. Replace with a family-verified pin before launch.
      url: "https://www.google.com/maps/search/?api=1&query=St.%20Michael%20The%20Archangel%20Parish%2C%20San%20Miguel%2C%20Tarlac%20City%2C%20Tarlac",
      verified: false,
    },
  },

  reception: {
    heading: "A Year of Love & Joy",
    text: "One wonderful year of precious smiles, sweet memories, and endless love. Join us as we celebrate Isabelle's very first birthday with the people who make her world brighter.",
    label: "Celebration Reception",
    time: "2:00 PM",
    venue: "Fernandez Private Resort",
    address: "St. Bernard Subdivision, San Francisco, Tarlac City, Tarlac",
    map: {
      // Family-requested landmark: Google Maps listing for St. Bernard Subdivision.
      // Opens Google's own result for this exact name (no guessed coordinates).
      url: "https://www.google.com/maps/search/?api=1&query=St.%20Bernard%20Subdivision%2C%20San%20Francisco%2C%20Tarlac%20City%2C%20Tarlac",
      verified: false,
    },
  },

  details: {
    heading: "A Few Little Details",
    dressCode: {
      heading: "Dress Code",
      rows: [
        { who: "Guests", what: "Casual attire" },
        { who: "Ninangs & Ninongs", what: "Semi-formal attire" },
      ],
      note: "We kindly ask everyone to avoid wearing pink.",
    },
    gifts: {
      heading: "A Little Gift Guide",
      text: "Your love and presence are already a wonderful gift. For those who wish to bring something for Isabelle, here are a few thoughtful suggestions.",
      items: [
        { icon: "envelope", label: "Monetary gifts" },
        { icon: "bottle", label: "Cetaphil Baby Bath Wash" },
        { icon: "diaper", label: "Huggies Magic Comfort, size XXL" },
        { icon: "shirt", label: "Clothing for ages 1 to 3 years" },
      ],
    },
    reminders: {
      heading: "Gentle Reminders",
      text: "To help keep Isabelle safe and healthy, please refrain from kissing her, sanitize your hands before touching her, and avoid smoking or vaping. If you feel unwell, please wear a mask. We completely understand if you choose to stay home and rest.",
      items: [
        { icon: "noKiss", label: "No kisses for Isabelle" },
        { icon: "sanitize", label: "Sanitize hands first" },
        { icon: "noSmoke", label: "No smoking or vaping" },
        { icon: "mask", label: "Mask if feeling unwell" },
      ],
    },
  },

  rsvp: {
    heading: "Will You Join Us?",
    text: "We would love to share this beautiful day with you. Kindly let us know by November 13, 2026.",
    // Through 11:59 PM on November 13, Philippine time.
    deadline: "2026-11-13T23:59:59+08:00",
    yesLabel: "Yes, I'll be there!",
    noLabel: "Sorry, I can't make it.",
    privacy:
      // Retention period is not family-confirmed yet; update once decided.
      "Your name and reply are only seen by Isabelle's family, for planning the celebration, and are never shared.",
    closedText: "RSVPs are now closed. If you still need to reach the family, please message them directly.",
  },

  closing: {
    heading: "Thank You",
    text: "Your love and presence mean so much to us. Thank you for being part of Isabelle's journey and for surrounding her with love, prayers, and blessings. We can't wait to celebrate this special day with you.",
    signoff: "With love,",
    signature: "Isabelle & Family",
  },
} as const;

export const godparents = {
  eyebrow: "A little letter just for you...",
  envelopeTitle: "A Special Invitation",
  // Letter copy is written in Isabelle's voice.
  letter: [
    "As I begin my journey of faith, I am surrounded by so much love.",
    "I would be so blessed to have someone special to guide me, pray for me, and share in the beautiful moments of my life.",
    "On my christening day, I would love for you to stand beside me as one of my godparents.",
  ],
  signoff: "With all my love,",
  signature: "Isabelle",
  roles: {
    ninong: { title: "Ninong", question: "Will you be my Ninong?" },
    ninang: { title: "Ninang", question: "Will you be my Ninang?" },
    generic: { title: "Ninong or Ninang", question: "Will you be my godparent?" },
  },
  acceptLabel: "Yes, I'd be honored",
  declineLabel: "I'm sorry, I can't",
  acceptedText:
    "Thank you for saying yes! Your love and prayers mean the world to Isabelle and her family.",
  declinedText:
    "Thank you for letting us know. We are so grateful for your love and prayers all the same.",
  separateNote: "Your answer here is separate from the event RSVP. Please RSVP on the invitation too.",
} as const;

export type GodparentRole = "ninong" | "ninang";
