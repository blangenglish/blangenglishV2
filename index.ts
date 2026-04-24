export const ROUTE_PATHS = {
  HOME: '/',
  LESSONS: '/lecciones',
  LIVE_CLASSES: '/clases-en-vivo',
  PROGRESS: '/mi-progreso',
  DASHBOARD: '/mi-cuenta',
  PRICING: '/precios',
  METHODOLOGY: '/metodologia',
  FAQ: '/preguntas-frecuentes',
  TERMS: '/terminos-de-servicio',
  PRIVACY: '/politica-de-privacidad',
  RESET_PASSWORD: '/reset-password',
} as const;

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  features: string[];
  popular?: boolean;
  cta: string;
  emoji: string;
  badge?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  country: string;
  flag: string;
  rating: number;
  quote: string;
  avatar: string;
  level: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Lesson {
  id: string;
  title: string;
  level: 'Básico' | 'Intermedio' | 'Avanzado';
  duration: string;
  topic: string;
  completed: boolean;
  locked: boolean;
  emoji: string;
}

export interface LiveClass {
  id: string;
  title: string;
  teacher: string;
  teacherAvatar: string;
  date: string;
  time: string;
  duration: string;
  level: string;
  spots: number;
  spotsLeft: number;
  topic: string;
  emoji: string;
}

export interface UserProgress {
  totalLessons: number;
  completedLessons: number;
  streak: number;
  points: number;
  level: string;
  nextLevel: string;
  weeklyGoal: number;
  weeklyCompleted: number;
  badges: Badge[];
  weeklyActivity: { day: string; minutes: number }[];
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  earned: boolean;
  description: string;
}

export type AuthModal = 'login' | 'register' | null;
