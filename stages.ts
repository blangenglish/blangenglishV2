// ─── Stage Material types ─────────────────────────────────────────────────────
export type Stage = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'ai_practice';
export type StageMaterialType = 'audio' | 'video' | 'pdf' | 'word' | 'ppt' | 'image' | 'url' | 'text';

export interface UnitStageMaterial {
  id: string;
  unit_id: string;
  stage: Stage;
  material_type: StageMaterialType;
  title: string;
  description: string;
  file_url: string | null;
  file_name: string | null;
  external_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const STAGES: { id: Stage; label: string; partLabel: string; emoji: string; color: string; bg: string; desc: string }[] = [
  { id: 'grammar',     label: 'Part 1 – Grammar',             partLabel: 'Part 1',  emoji: '📚', color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200',  desc: 'Reglas gramaticales, estructuras y ejercicios' },
  { id: 'vocabulary',  label: 'Part 2 – Vocabulary',          partLabel: 'Part 2',  emoji: '📖', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      desc: 'Palabras, expresiones y frases clave' },
  { id: 'reading',     label: 'Part 3 – Reading',             partLabel: 'Part 3',  emoji: '📰', color: 'text-green-600',   bg: 'bg-green-50 border-green-200',    desc: 'Textos, artículos y comprensión lectora' },
  { id: 'listening',   label: 'Part 4 – Listening',           partLabel: 'Part 4',  emoji: '🎧', color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',  desc: 'Audios, podcasts y comprensión auditiva' },
  { id: 'ai_practice', label: 'Part 5 – Practice', partLabel: 'Part 5', emoji: '🤖', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200', desc: 'Práctica interactiva con inteligencia artificial' },
];

export const MATERIAL_TYPE_CONFIG: Record<StageMaterialType, { label: string; emoji: string; accept: string; isFile: boolean }> = {
  audio:  { label: 'Audio',           emoji: '🎵', accept: '.mp3,.wav,.ogg,.m4a,.aac', isFile: true },
  video:  { label: 'Video',           emoji: '🎬', accept: '.mp4,.webm,.mov',           isFile: true },
  pdf:    { label: 'PDF',             emoji: '📄', accept: '.pdf',                       isFile: true },
  word:   { label: 'Word',            emoji: '📝', accept: '.doc,.docx',                 isFile: true },
  ppt:    { label: 'PowerPoint',      emoji: '📊', accept: '.ppt,.pptx',                 isFile: true },
  image:  { label: 'Imagen',          emoji: '🖼️', accept: '.jpg,.jpeg,.png,.gif,.webp', isFile: true },
  url:    { label: 'URL / Enlace',    emoji: '🔗', accept: '',                            isFile: false },
  text:   { label: 'Texto / Nota',    emoji: '✏️', accept: '',                            isFile: false },
};
