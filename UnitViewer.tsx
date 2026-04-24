import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  X, Film, ExternalLink, Link2,
  Loader2, BookOpen, Lock, CheckCircle2,
  ChevronRight, ChevronLeft, Trophy, Circle,
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

// ─── Material renderer ────────────────────────────────────────────────────────
function MaterialItem({ mat }: { mat: UnitStageMaterial }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/50">
        <span className="text-base">{MATERIAL_TYPE_CONFIG[mat.material_type].emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{mat.title}</p>
          {mat.description && <p className="text-xs text-muted-foreground truncate">{mat.description}</p>}
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {MATERIAL_TYPE_CONFIG[mat.material_type].label}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3">
        {mat.material_type === 'audio' && mat.file_url && (
          <audio src={mat.file_url} controls className="w-full" />
        )}
        {mat.material_type === 'video' && mat.file_url && (
          <video src={mat.file_url} controls className="w-full rounded-lg max-h-64 bg-black" />
        )}
        {mat.material_type === 'image' && mat.file_url && (
          <img src={mat.file_url} alt={mat.title} className="w-full rounded-lg max-h-64 object-contain" />
        )}
        {mat.material_type === 'pdf' && mat.file_url && (
          <div className="space-y-2">
            <iframe src={`${mat.file_url}#toolbar=1`} className="w-full h-64 rounded-lg border border-border" title={mat.title} />
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => window.open(mat.file_url!, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" /> Abrir PDF completo
            </Button>
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
          <div className="p-3 rounded-lg bg-muted/20 border border-border">
            <p className="text-sm whitespace-pre-wrap">{mat.description}</p>
          </div>
        )}
      </div>
    </div>
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
  const allDone = stagesWithContent.length > 0 && completedCount === stagesWithContent.length;

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
    const row = {
      student_id: studentId,
      unit_id: unitId,
      stage: currentStage.id,
      completed: true,
      completed_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('unit_progress')
      .upsert(row, { onConflict: 'student_id,unit_id,stage' });
    if (!error) {
      setProgress(prev => ({
        ...prev,
        [currentStage.id]: { completed: true, completed_at: row.completed_at, quiz_passed: prev[currentStage.id]?.quiz_passed ?? false },
      }));
      // Auto-avanzar si hay siguiente
      if (localIdx < stagesWithContent.length - 1) {
        setTimeout(() => {
          const targetStage = stagesWithContent[localIdx + 1];
          setCurrentStageIdx(STAGES.findIndex(s => s.id === targetStage.id));
        }, 600);
      }
    }
    setMarkingDone(false);
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
              {currentMaterials.map(mat => <MaterialItem key={mat.id} mat={mat} />)}
            </div>

            {/* Bloque de acción inferior */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
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
                /* Ya completada → solo navegación */
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="gap-2 rounded-xl" onClick={goPrev} disabled={localIdx === 0}>
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </Button>
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
