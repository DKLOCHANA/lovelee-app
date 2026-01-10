// Mood Emojis for mood sharing feature
export const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#FFD93D' },
  { id: 'love', emoji: '🥰', label: 'In Love', color: '#FF6B8A' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: '#FF9F43' },
  { id: 'relaxed', emoji: '😌', label: 'Relaxed', color: '#98D4A0' },
  { id: 'sleepy', emoji: '😴', label: 'Sleepy', color: '#A8D8EA' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking', color: '#D4A5D9' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#6BADE8' },
  { id: 'angry', emoji: '😤', label: 'Angry', color: '#FF6B6B' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#FFB347' },
  { id: 'grateful', emoji: '🙏', label: 'Grateful', color: '#98D4A0' },
  { id: 'playful', emoji: '😜', label: 'Playful', color: '#FFB6C1' },
  { id: 'romantic', emoji: '😘', label: 'Romantic', color: '#FF6B8A' },
];

// Quick gifts/affections
export const GIFTS = [
  { id: 'heart', emoji: '❤️', label: 'Heart', hearts: 5, premium: false },
  { id: 'kiss', emoji: '💋', label: 'Kiss', hearts: 5, premium: false },
  { id: 'hug', emoji: '🤗', label: 'Hug', hearts: 5, premium: false },
  { id: 'rose', emoji: '🌹', label: 'Rose', hearts: 10, premium: false },
  { id: 'bouquet', emoji: '💐', label: 'Bouquet', hearts: 20, premium: false },
  { id: 'teddy', emoji: '🧸', label: 'Teddy Bear', hearts: 25, premium: false },
  { id: 'chocolate', emoji: '🍫', label: 'Chocolate', hearts: 10, premium: false },
  { id: 'cake', emoji: '🎂', label: 'Cake', hearts: 15, premium: false },
  { id: 'coffee', emoji: '☕', label: 'Coffee', hearts: 10, premium: false },
  { id: 'donut', emoji: '🍩', label: 'Donut', hearts: 10, premium: false },
  { id: 'pizza', emoji: '🍕', label: 'Pizza', hearts: 15, premium: false },
    // Premium gifts after ring
  { id: 'ring', emoji: '💍', label: 'Ring', hearts: 50, premium: true },
  { id: 'star', emoji: '⭐', label: 'Star', hearts: 10, premium: true },
  { id: 'moon', emoji: '🌙', label: 'Moon', hearts: 15, premium: true },
  { id: 'sun', emoji: '☀️', label: 'Sunshine', hearts: 10, premium: true },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow', hearts: 20, premium: true },
  { id: 'sparkles', emoji: '✨', label: 'Sparkles', hearts: 5, premium: true },
  { id: 'fire', emoji: '🔥', label: 'Fire', hearts: 15, premium: true },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly', hearts: 15, premium: true },
  { id: 'crown', emoji: '👑', label: 'Crown', hearts: 30, premium: true },
];

// Pet skins/customizations
export const PET_SKINS = [
  { id: 'piggy', name: 'Piggy', image: '🐷', unlocked: true, cost: 0 },
  { id: 'bunny', name: 'Bunny', image: '🐰', unlocked: false, cost: 100 },
  { id: 'bear', name: 'Bear', image: '🐻', unlocked: false, cost: 150 },
  { id: 'cat', name: 'Kitty', image: '🐱', unlocked: false, cost: 150 },
  { id: 'dog', name: 'Puppy', image: '🐶', unlocked: false, cost: 150 },
  { id: 'panda', name: 'Panda', image: '🐼', unlocked: false, cost: 200 },
  { id: 'koala', name: 'Koala', image: '🐨', unlocked: false, cost: 200 },
  { id: 'unicorn', name: 'Unicorn', image: '🦄', unlocked: false, cost: 300 },
];

// Room items for Love Zone
export const ROOM_ITEMS = [
  { id: 'plant1', name: 'Succulent', emoji: '🪴', cost: 50, category: 'plants' },
  { id: 'plant2', name: 'Flower', emoji: '🌸', cost: 30, category: 'plants' },
  { id: 'plant3', name: 'Tree', emoji: '🌳', cost: 80, category: 'plants' },
  { id: 'couch', name: 'Couch', emoji: '🛋️', cost: 100, category: 'furniture' },
  { id: 'lamp', name: 'Lamp', emoji: '🪔', cost: 40, category: 'furniture' },
  { id: 'frame', name: 'Photo Frame', emoji: '🖼️', cost: 60, category: 'decor' },
  { id: 'candle', name: 'Candle', emoji: '🕯️', cost: 25, category: 'decor' },
  { id: 'books', name: 'Books', emoji: '📚', cost: 35, category: 'decor' },
  { id: 'clock', name: 'Clock', emoji: '🕰️', cost: 45, category: 'decor' },
  { id: 'mirror', name: 'Mirror', emoji: '🪞', cost: 70, category: 'furniture' },
];

// Question packs for check-ins
export const QUESTION_PACKS = [
  {
    id: 'daily',
    name: 'Daily Check-in',
    description: 'Quick daily questions to stay connected',
    questions: [
      'How was your day today?',
      'What made you smile today?',
      'Did you think about me today?',
      'What are you grateful for today?',
      'How are you feeling right now?',
    ],
    unlocked: true,
  },
  {
    id: 'deep',
    name: 'Deep Connection',
    description: 'Questions to deepen your bond',
    questions: [
      'What do you love most about our relationship?',
      'What is your favorite memory of us?',
      'How can I support you better?',
      'What dreams do you have for our future?',
      'What makes you feel most loved?',
    ],
    unlocked: true,
  },
  {
    id: 'fun',
    name: 'Fun & Playful',
    description: 'Lighthearted questions for fun',
    questions: [
      'If we could travel anywhere, where would you want to go?',
      'What would be our perfect date night?',
      'What song reminds you of us?',
      'What superpower would you want us to share?',
      'What movie describes our relationship?',
    ],
    unlocked: false,
  },
];

export default {
  MOODS,
  GIFTS,
  PET_SKINS,
  ROOM_ITEMS,
  QUESTION_PACKS,
};
