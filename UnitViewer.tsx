import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  X, Film, ExternalLink, Link2,
  Loader2, BookOpen, Lock, CheckCircle2,
  ChevronRight, ChevronLeft, Trophy, Circle, Volume2,
} from 'lucide-react';
import { STAGES, MATERIAL_TYPE_CONFIG, type Stage, type UnitStageMaterial } from '@/lib/stages';

// ─── YouTube helpers ──────────────────────────────────────────────────────────
function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function getEmbedUrl(url: string) {
  const yt = extractYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
function getYouTubeThumbnail(url: string) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// ─── Progress row type ────────────────────────────────────────────────────────
interface StageProgress {
  completed: boolean;
  completed_at: string | null;
  quiz_passed: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

// ─── Vocabulary TTS — usa <audio> con Google TTS (no congela el navegador) ─────
function VocabularyTTSContent({ text }: { text: string }) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const plainText = text.includes('<') ? stripHtml(text) : text;
  const lines = plainText.split('\n').map(l => l.trim()).filter(Boolean);

  const parseLine = (line: string) => {
    const m = line.match(/^(.+?)\s*[-:|]\s*(.+)$/);
    if (m) return { english: m[1].trim(), translation: m[2].trim() };
    return { english: line, translation: null };
  };

  const handlePlay = (english: string, idx: number) => {
    if (!('speechSynthesis' in window)) return;
    setPlayingIdx(idx);
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(english);
    utter.lang = 'en-US';
    utter.rate = 0.85;
    utter.pitch = 1.0;
    utter.onend = () => setPlayingIdx(null);
    utter.onerror = () => setPlayingIdx(null);
    // Usar voz en-US si está disponible
    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
    if (usVoice) utter.voice = usVoice;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const { english, translation } = parseLine(line);
        const isPlaying = playingIdx === i;
        return (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10 hover:bg-blue-50/40 transition-colors group"
          >
            <button
              onClick={() => handlePlay(english, i)}
              title={`Escuchar: ${english}`}
              disabled={isPlaying}
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border ${
                isPlaying
                  ? 'bg-blue-500 border-blue-400 text-white scale-110 shadow-blue-200 cursor-default'
                  : 'bg-white border-blue-200 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 group-hover:scale-105'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
            </button>
            <span className="font-semibold text-base text-foreground flex-1">{english}</span>
            {translation && (
              <span className="text-sm text-muted-foreground italic border-l border-border pl-3">{translation}</span>
            )}
          </div>
        );
      })}
      {lines.length === 0 && (
        <p className="text-sm text-muted-foreground italic p-3">Sin contenido aún</p>
      )}
    </div>
  );
}

// ─── Reading with tap-to-translate ─────────────────────────────────────────
function ReadingWithTranslation({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string; translation: string | null; loading: boolean;
    x: number; y: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const translate = async (text: string) => {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`
      );
      const data = await res.json();
      const t = data?.responseData?.translatedText;
      if (t && t.toLowerCase() !== text.toLowerCase()) return t;
      return null;
    } catch {
      return null;
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    const sel = window.getSelection();
    const selected = sel?.toString().trim();
    if (!selected || selected.length < 1 || selected.length > 200) {
      setTooltip(null);
      return;
    }
    // Posición del tooltip
    const rect = (e.target as HTMLElement).closest('[data-reading]')?.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const x = Math.min(e.clientX - containerRect.left, containerRect.width - 220);
    const y = e.clientY - containerRect.top - 10;
    setTooltip({ text: selected, translation: null, loading: true, x: Math.max(0, x), y });
    const result = await translate(selected);
    setTooltip(prev => prev?.text === selected ? { ...prev, translation: result, loading: false } : prev);
  };

  // Cerrar tooltip al hacer clic fuera
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        data-reading="true"
        className="p-4 rounded-lg bg-muted/20 border border-border prose prose-sm max-w-none text-sm leading-relaxed select-text cursor-text"
        dangerouslySetInnerHTML={{ __html: html }}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp as unknown as React.TouchEventHandler}
      />
      {/* Hint */}
      <p className="text-[11px] text-muted-foreground text-center mt-1.5 italic">
        💡 Selecciona una palabra o frase para ver su traducción
      </p>
      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 min-w-[160px] max-w-[260px] pointer-events-auto"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateY(-100%)' }}
        >
          <p className="text-xs font-bold text-blue-300 mb-0.5 truncate">🔤 {tooltip.text}</p>
          {tooltip.loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Traduciendo...
            </div>
          ) : tooltip.translation ? (
            <p className="text-sm font-semibold text-yellow-300">{tooltip.translation}</p>
          ) : (
            <p className="text-xs text-gray-400 italic">No encontrado</p>
          )}
          {/* Arrow */}
          <div className="absolute left-4 bottom-0 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// ─── Material renderer ────────────────────────────────────────────────────────
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-800" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl"
        />
        <p className="text-center text-white/60 text-xs mt-2">Toca fuera para cerrar</p>
      </div>
    </div>
  );
}

function MaterialItem({ mat, stage }: { mat: UnitStageMaterial; stage?: string }) {
  const [playing, setPlaying] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
    {lightbox && mat.file_url && (
      <ImageLightbox src={mat.file_url} alt={mat.title} onClose={() => setLightbox(false)} />
    )}
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/50">
        <span className="text-base">{MATERIAL_TYPE_CONFIG[mat.material_type].emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{mat.title}</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {MATERIAL_TYPE_CONFIG[mat.material_type].label}
        </Badge>
      </div>

      {/* Instrucciones — visible para el estudiante antes del recurso */}
      {mat.material_type !== 'text' && mat.description && (
        <div className="mx-3 mt-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
          <span className="text-base shrink-0 mt-0.5">📋</span>
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Instrucciones</p>
            <div
              className="text-sm text-amber-900 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: mat.description }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {mat.material_type === 'audio' && mat.file_url && (
          <audio src={mat.file_url} controls className="w-full" />
        )}
        {mat.material_type === 'video' && mat.file_url && (
          <video src={mat.file_url} controls className="w-full rounded-lg max-h-64 bg-black" />
        )}
        {mat.material_type === 'image' && mat.file_url && (
          <div className="space-y-1.5">
            <div
              className="relative group cursor-zoom-in"
              onClick={() => setLightbox(true)}
            >
              <img
                src={mat.file_url}
                alt={mat.title}
                className="w-full rounded-lg object-contain max-h-96"
              />
              {/* Overlay hint */}
              <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                  </svg>
                  Ampliar imagen
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">Toca la imagen para ampliarla 🔍</p>
          </div>
        )}
        {mat.material_type === 'pdf' && mat.file_url && (
          <div className="space-y-3">
            {/* Preview card — el iframe falla en Supabase Storage por cabeceras CORS */}
            <div
              className="w-full rounded-xl border-2 border-dashed border-red-200 bg-red-50 flex flex-col items-center justify-center gap-3 py-8 cursor-pointer hover:bg-red-100 transition-colors group"
              onClick={() => window.open(mat.file_url!, '_blank')}
            >
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17.5h-1v-5h1.8c1.1 0 1.7.6 1.7 1.5 0 1-.7 1.5-1.8 1.5H8.5v2zm0-2.8h.7c.5 0 .8-.2.8-.7s-.3-.7-.8-.7H8.5v1.4zm4.5 2.8h-1.6v-5H13c1.5 0 2.5.9 2.5 2.5S14.5 17.5 13 17.5zm-.6-1h.5c.9 0 1.5-.5 1.5-1.5S13.8 13.5 13 13.5h-.6v3zm5.1-4h-2.5v5h1v-1.8h1.4v-1H16v-1.2h1.5v-1z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-red-700">{mat.title}</p>
                <p className="text-xs text-red-500 mt-0.5">Toca para abrir el PDF</p>
              </div>
              <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow group-hover:bg-red-600 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir PDF
              </div>
            </div>
          </div>
        )}
        {(mat.material_type === 'word' || mat.material_type === 'ppt') && mat.file_url && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
            <span className="text-3xl">{mat.material_type === 'ppt' ? '📊' : '📝'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{mat.file_name || mat.title}</p>
              <p className="text-xs text-muted-foreground">{MATERIAL_TYPE_CONFIG[mat.material_type].label}</p>
            </div>
            <Button variant="default" size="sm" className="gap-1.5 shrink-0" onClick={() => window.open(mat.file_url!, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" /> Descargar
            </Button>
          </div>
        )}
        {mat.material_type === 'url' && mat.external_url && (() => {
          const ytThumb = getYouTubeThumbnail(mat.external_url);
          const embedSrc = getEmbedUrl(mat.external_url);
          if (ytThumb) return (
            <div className="rounded-xl overflow-hidden border border-border bg-black">
              {!playing ? (
                <div className="relative cursor-pointer group" onClick={() => setPlaying(true)}>
                  <img src={ytThumb} alt="YouTube" className="w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl">
                      <Film className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                </div>
              ) : embedSrc ? (
                <iframe src={embedSrc} className="w-full aspect-video" allowFullScreen />
              ) : null}
            </div>
          );
          return (
            <a href={mat.external_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-primary underline truncate flex-1">{mat.external_url}</p>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </a>
          );
        })()}
        {mat.material_type === 'text' && mat.description && (
          stage === 'vocabulary'
            ? <VocabularyTTSContent text={mat.description} />
            : stage === 'reading'
              ? <ReadingWithTranslation html={mat.description} />
              : (
                <div className="p-3 rounded-lg bg-muted/20 border border-border prose prose-sm max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: mat.description }}
                />
              )
        )}
      </div>
    </div>
    </>
  );
}

// ─── Stepper dot ──────────────────────────────────────────────────────────────
function StepDot({ idx, currentIdx, completed, label }: {
  idx: number; currentIdx: number; completed: boolean; label: string;
}) {
  const isActive = idx === currentIdx;
  const isPast = idx < currentIdx;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
        completed ? 'bg-green-500 border-green-500 text-white' :
        isActive  ? 'bg-primary border-primary text-primary-foreground' :
        isPast    ? 'bg-muted border-muted-foreground/30 text-muted-foreground' :
                    'bg-background border-border text-muted-foreground'
      )}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
      </div>
      <span className={cn('text-[9px] font-medium text-center w-12 leading-tight',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}>{label}</span>
    </div>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────
interface UnitViewerProps {
  unitId: string;
  unitTitle: string;
  unitDescription?: string;
  studentId: string;
  onClose: () => void;
  isLocked?: boolean;
}

export function UnitViewer({ unitId, unitTitle, unitDescription, studentId, onClose, isLocked = false }: UnitViewerProps) {
  const [byStage, setByStage] = useState<Record<Stage, UnitStageMaterial[]>>({
    grammar: [], vocabulary: [], reading: [], listening: [], ai_practice: [],
  });
  const [progress, setProgress] = useState<Partial<Record<Stage, StageProgress>>>({});
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [forceAllDone, setForceAllDone] = useState(false);

  // Cargar materiales y progreso
  const loadData = useCallback(async () => {
    if (isLocked) { setLoading(false); return; }

    const [{ data: materials }, { data: prog }] = await Promise.all([
      supabase.from('unit_stage_materials').select('*')
        .eq('unit_id', unitId).eq('is_published', true)
        .order('sort_order', { ascending: true }),
      supabase.from('unit_progress').select('*')
        .eq('unit_id', unitId).eq('student_id', studentId),
    ]);

    const map: Record<Stage, UnitStageMaterial[]> = {
      grammar: [], vocabulary: [], reading: [], listening: [], ai_practice: [],
    };
    (materials as UnitStageMaterial[] || []).forEach(m => {
      if (m.stage in map) map[m.stage as Stage].push(m);
    });
    setByStage(map);

    const progMap: Partial<Record<Stage, StageProgress>> = {};
    (prog || []).forEach((p: { stage: string; completed: boolean; completed_at: string | null; quiz_passed: boolean }) => {
      progMap[p.stage as Stage] = { completed: p.completed, completed_at: p.completed_at, quiz_passed: p.quiz_passed };
    });
    setProgress(progMap);

    // Ir a la primera parte no completada que tenga contenido
    const stagesWithContent = STAGES.filter(s => map[s.id].length > 0);
    const firstIncomplete = stagesWithContent.findIndex(s => !progMap[s.id]?.completed);
    const startIdx = firstIncomplete >= 0 ? firstIncomplete : Math.max(0, stagesWithContent.length - 1);
    const globalIdx = STAGES.findIndex(s => s.id === (stagesWithContent[startIdx]?.id || STAGES[0].id));
    setCurrentStageIdx(globalIdx >= 0 ? globalIdx : 0);

    setLoading(false);
  }, [unitId, studentId, isLocked]);

  useEffect(() => { loadData(); }, [loadData]);

  // Partes con contenido
  const stagesWithContent = STAGES.filter(s => byStage[s.id].length > 0);
  const currentStage = STAGES[currentStageIdx];
  const currentMaterials = currentStage ? byStage[currentStage.id] : [];

  // ¿Tiene quiz esta parte?
  const stageHasQuiz = currentMaterials.some(m => m.material_type === 'text' && m.title?.toLowerCase().includes('quiz'));

  // ¿Está completa la parte actual?
  const currentCompleted = currentStage ? !!progress[currentStage.id]?.completed : false;

  // ¿Cuántas partes con contenido están completadas?
  const completedCount = stagesWithContent.filter(s => progress[s.id]?.completed).length;
  const progressPct = stagesWithContent.length > 0 ? Math.round((completedCount / stagesWithContent.length) * 100) : 0;
  const allDone = forceAllDone || (stagesWithContent.length > 0 && completedCount === stagesWithContent.length);

  // Índice local de la parte actual dentro de las que tienen contenido
  const localIdx = stagesWithContent.findIndex(s => s.id === currentStage?.id);

  // Navegar a anterior / siguiente
  const goPrev = () => {
    if (localIdx > 0) {
      const targetStage = stagesWithContent[localIdx - 1];
      setCurrentStageIdx(STAGES.findIndex(s => s.id === targetStage.id));
    }
  };
  const goNext = () => {
    if (localIdx < stagesWithContent.length - 1) {
      const targetStage = stagesWithContent[localIdx + 1];
      setCurrentStageIdx(STAGES.findIndex(s => s.id === targetStage.id));
    }
  };

  // Marcar parte como completada
  const markCompleted = async () => {
    if (!currentStage || markingDone) return;
    setMarkingDone(true);

    const stageSnapshot = currentStage;        // capturar antes del await
    const localIdxSnapshot = localIdx;
    const stagesSnapshot = [...stagesWithContent];

    try {
      const row = {
        student_id: studentId,
        unit_id: unitId,
        stage: stageSnapshot.id,
        completed: true,
        completed_at: new Date().toISOString(),
      };

      // Intentar upsert primero
      let { error } = await supabase
        .from('unit_progress')
        .upsert(row, { onConflict: 'student_id,unit_id,stage' });

      // Si falla upsert, intentar insert; si ya existe, intentar update
      if (error) {
        console.warn('[markCompleted] upsert error, trying insert:', error.message);
        const ins = await supabase.from('unit_progress').insert(row);
        if (ins.error) {
          console.warn('[markCompleted] insert error, trying update:', ins.error.message);
          const upd = await supabase
            .from('unit_progress')
            .update({ completed: true, completed_at: row.completed_at })
            .eq('student_id', studentId)
            .eq('unit_id', unitId)
            .eq('stage', stageSnapshot.id);
          if (upd.error) {
            console.error('[markCompleted] all methods failed:', upd.error.message);
          } else {
            error = null;
          }
        } else {
          error = null;
        }
      }

      // Actualizar estado local SIN IMPORTAR si hubo error de DB
      setProgress(prev => {
        const updated = {
          ...prev,
          [stageSnapshot.id]: {
            completed: true,
            completed_at: row.completed_at,
            quiz_passed: prev[stageSnapshot.id]?.quiz_passed ?? false,
          },
        };
        // Verificar si con este update ya están todas completadas
        const doneCount = stagesSnapshot.filter(s => updated[s.id]?.completed).length;
        if (doneCount === stagesSnapshot.length) {
          // Última parte completada → forzar pantalla de unidad completa
          setTimeout(() => setForceAllDone(true), 400);
        }
        return updated;
      });

      if (error) {
        console.warn('[markCompleted] DB save failed but advancing anyway:', error.message);
      }

      // Auto-avanzar si hay siguiente parte
      if (localIdxSnapshot < stagesSnapshot.length - 1) {
        setTimeout(() => {
          const targetStage = stagesSnapshot[localIdxSnapshot + 1];
          setCurrentStageIdx(STAGES.findIndex(s => s.id === targetStage.id));
        }, 500);
      }
    } catch (e) {
      console.error('[markCompleted] unexpected error:', e);
      // Avanzar de todos modos para no bloquear al estudiante
      if (localIdxSnapshot < stagesWithContent.length - 1) {
        const targetStage = stagesWithContent[localIdxSnapshot + 1];
        setCurrentStageIdx(STAGES.findIndex(s => s.id === targetStage.id));
      }
    } finally {
      setMarkingDone(false);
    }
  };

  // ¿Puede avanzar a la siguiente parte?
  // Si tiene quiz → necesita completar; si no → puede avanzar directamente o marcar completado
  const canAdvance = currentCompleted || !stageHasQuiz;

  if (isLocked) return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="border-b border-border bg-card shrink-0 px-4 py-3 flex items-center gap-3">
        <div className="flex-1"><h1 className="text-base font-bold truncate">{unitTitle}</h1></div>
        <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-lg">Contenido bloqueado</p>
        <p className="text-sm text-muted-foreground">Suscríbete al plan mensual para acceder a esta unidad</p>
        <Button onClick={onClose}>Ver planes</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* ── Header ── */}
      <div className="border-b border-border bg-card shrink-0 px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <h1 className="text-base font-bold truncate">{unitTitle}</h1>
            </div>
            {unitDescription && <p className="text-xs text-muted-foreground truncate mt-0.5 ml-6">{unitDescription}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Barra de progreso de la unidad */}
        {!loading && stagesWithContent.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{completedCount} de {stagesWithContent.length} partes completadas</span>
              <span className="font-bold text-primary">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : stagesWithContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Esta unidad aún no tiene materiales</p>
            <p className="text-sm text-muted-foreground">El instructor está preparando el contenido</p>
          </div>
        ) : allDone ? (
          /* ── 🎉 Unidad completada ── */
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-5">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <p className="font-extrabold text-2xl text-green-700">¡Unidad completada! 🎉</p>
              <p className="text-muted-foreground text-sm mt-2">Has terminado todas las partes de <strong>{unitTitle}</strong>.<br />Puedes repasar cualquier parte cuando quieras.</p>
            </div>
            {/* Repaso */}
            <div className="w-full max-w-sm space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Repasar parte</p>
              {stagesWithContent.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStageIdx(STAGES.findIndex(x => x.id === s.id))}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">{s.partLabel} – {s.label.split('–')[1]?.trim()}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
            <Button variant="outline" className="rounded-xl gap-2" onClick={onClose}>
              Volver al curso
            </Button>
          </div>
        ) : (
          /* ── Vista de parte actual ── */
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

            {/* Stepper visual */}
            <div className="flex items-center justify-center gap-1 overflow-x-auto py-2">
              {stagesWithContent.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => {
                      // Solo puede ir a partes anteriores completadas o la actual
                      const targetLocalIdx = i;
                      const canGo = i <= localIdx || progress[s.id]?.completed;
                      if (canGo) setCurrentStageIdx(STAGES.findIndex(x => x.id === s.id));
                    }}
                    className="focus:outline-none"
                  >
                    <StepDot
                      idx={i}
                      currentIdx={localIdx}
                      completed={!!progress[s.id]?.completed}
                      label={s.partLabel}
                    />
                  </button>
                  {i < stagesWithContent.length - 1 && (
                    <div className={cn(
                      'w-6 h-0.5 mx-0.5 mb-4 transition-colors',
                      progress[s.id]?.completed ? 'bg-green-400' : 'bg-border'
                    )} />
                  )}
                </div>
              ))}
            </div>

            {/* Encabezado de la parte actual */}
            {currentStage && (
              <div className={cn('rounded-2xl border-2 p-4', currentStage.bg)}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentStage.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('font-extrabold text-base', currentStage.color)}>{currentStage.label}</p>
                      {currentCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Completada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{currentStage.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{localIdx + 1}/{stagesWithContent.length}</Badge>
                </div>
              </div>
            )}

            {/* Materiales */}
            <div className="space-y-3">
              {currentMaterials.map(mat => <MaterialItem key={mat.id} mat={mat} stage={currentStage?.id} />)}
            </div>

            {/* Bloque de acción inferior */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">

              {/* Botón ← Anterior — siempre visible si hay parte anterior */}
              {localIdx > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-xl gap-2 text-muted-foreground hover:text-foreground border border-dashed border-border/60"
                  onClick={goPrev}
                >
                  <ChevronLeft className="w-4 h-4" /> Regresar a parte anterior
                </Button>
              )}

              {!currentCompleted ? (
                <>
                  {stageHasQuiz ? (
                    <div className="text-center space-y-2">
                      <p className="text-sm font-semibold">📝 Esta parte tiene un quiz</p>
                      <p className="text-xs text-muted-foreground">Completa el quiz para marcar esta parte como terminada y avanzar.</p>
                      <Button
                        className="w-full rounded-xl font-bold gap-2"
                        onClick={markCompleted}
                        disabled={markingDone}
                      >
                        {markingDone ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {markingDone ? 'Guardando...' : 'Marcar quiz como completado ✓'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl gap-2"
                        onClick={markCompleted}
                        disabled={markingDone}
                      >
                        {markingDone ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {markingDone ? 'Guardando...' : 'Marcar como completada'}
                      </Button>
                      {localIdx < stagesWithContent.length - 1 && (
                        <Button
                          className="flex-1 rounded-xl gap-2 font-bold"
                          onClick={() => { markCompleted(); }}
                          disabled={markingDone}
                        >
                          Siguiente parte <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Ya completada → navegación adelante */
                <div className="flex items-center gap-3">
                  {localIdx < stagesWithContent.length - 1 ? (
                    <Button className="flex-1 rounded-xl gap-2 font-bold" onClick={goNext}>
                      Siguiente parte <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                      <Trophy className="w-4 h-4" /> Unidad completa
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Menú rápido de partes */}
            {stagesWithContent.length > 1 && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Partes de la unidad</p>
                <div className="space-y-1">
                  {stagesWithContent.map((s, i) => {
                    const isThisCurrent = s.id === currentStage?.id;
                    const isThisDone = !!progress[s.id]?.completed;
                    // Puede navegar a: partes anteriores, la actual, o cualquier completada
                    const canClick = i <= localIdx || isThisDone;
                    return (
                      <button
                        key={s.id}
                        disabled={!canClick}
                        onClick={() => canClick && setCurrentStageIdx(STAGES.findIndex(x => x.id === s.id))}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors text-sm',
                          isThisCurrent ? 'bg-primary/10 border border-primary/30 font-semibold' :
                          isThisDone ? 'hover:bg-green-50 text-muted-foreground' :
                          canClick ? 'hover:bg-muted/50 text-muted-foreground' :
                          'opacity-40 cursor-not-allowed text-muted-foreground'
                        )}
                      >
                        <span className="text-base shrink-0">{s.emoji}</span>
                        <span className="flex-1 truncate">{s.label}</span>
                        {isThisDone ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : isThisCurrent ? (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0.5 shrink-0">Actual</Badge>
                        ) : canClick ? (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
