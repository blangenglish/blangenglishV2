export const ADMIN_ROUTES = {
  LOGIN: '/adminblang/login',
  DASHBOARD: '/adminblang',
  COURSES: '/adminblang/cursos',
  PRICING: '/adminblang/precios',
  PAYMENTS: '/adminblang/pagos',
  SETTINGS: '/adminblang/configuracion',
  STUDENTS: '/adminblang/estudiantes',
  REVENUE: '/adminblang/ingresos',
  SITE_EDITOR: '/adminblang/sitio',
} as const;

export interface DBCourse {
  id: string;
  emoji: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  level_label: string;
  description: string;
  total_units: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DBUnit {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type MaterialType =
  | 'grammar'
  | 'vocabulary'
  | 'reading'
  | 'listening'
  | 'ai_practice'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'ppt'
  | 'image'
  | 'link'
  | 'text';

export interface DBMaterial {
  id: string;
  unit_id: string;
  type: MaterialType;
  title: string;
  content: string;
  file_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBPricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_usd: number;
  price_cop: number;
  billing_period: string;
  emoji: string;
  cta_text: string;
  badge: string | null;
  is_popular: boolean;
  is_published: boolean;
  features: unknown[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DBSiteSettings {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export type BlockType =
  | 'TEXT'
  | 'HEADING'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'DIVIDER'
  | 'EMBED';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: {
    text?: string;
    html?: string;
    level?: 'h1' | 'h2' | 'h3';
    color?: string;
    url?: string;
    caption?: string;
    transcript?: string;
    embedUrl?: string;
  };
  sort_order: number;
  is_published: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  sort_order: number;
}

export interface DBQuiz {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  pass_score: number;
  questions: QuizQuestion[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const MATERIAL_TYPE_LABELS: Record<MaterialType, { label: string; emoji: string }> = {
  grammar:    { label: 'Gramática',    emoji: '📚' },
  vocabulary: { label: 'Vocabulario',  emoji: '📖' },
  reading:    { label: 'Lectura',      emoji: '📰' },
  listening:  { label: 'Audio / Escucha', emoji: '🎧' },
  ai_practice:{ label: 'Práctica IA', emoji: '🤖' },
  video:      { label: 'Video',        emoji: '🎥' },
  audio:      { label: 'Audio',        emoji: '🔊' },
  pdf:        { label: 'PDF',          emoji: '📄' },
  ppt:        { label: 'Presentación (PPT)', emoji: '📊' },
  image:      { label: 'Imagen',       emoji: '🖼️' },
  link:       { label: 'Enlace',       emoji: '🔗' },
  text:       { label: 'Texto',        emoji: '📝' },
};