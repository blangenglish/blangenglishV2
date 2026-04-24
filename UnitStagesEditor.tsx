import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  X, Plus, Trash2, Upload, Music, Film, FileText,
  Paperclip, Image as ImageIcon, Link2, AlignLeft,
  ChevronUp, ChevronDown, Eye, EyeOff, Loader2,
  CheckCircle2, RefreshCw, ExternalLink, Bold, Italic,
  Underline, List, AlignCenter, AlignLeft as AlignL, Type,
  HelpCircle, GripVertical, Check, PenLine,
} from 'lucide-react';
import {
  STAGES, MATERIAL_TYPE_CONFIG,
  type Stage, type StageMaterialType, type UnitStageMaterial,
} from '@/lib/stages';

// ─── helpers ─────────────────────────────────────────────────────────────────
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

const TYPE_ICONS: Record<StageMaterialType, React.ReactNode> = {
  audio:  <Music className="h-4 w-4 text-green-500" />,
  video:  <Film className="h-4 w-4 text-blue-500" />,
  pdf:    <FileText className="h-4 w-4 text-red-500" />,
  word:   <AlignLeft className="h-4 w-4 text-blue-600" />,
  ppt:    <Paperclip className="h-4 w-4 text-orange-500" />,
  image:  <ImageIcon className="h-4 w-4 text-purple-500" />,
  url:    <Link2 className="h-4 w-4 text-cyan-500" />,
  text:   <AlignLeft className="h-4 w-4 text-gray-500" />,
};

// ─── Rich Text Toolbar ────────────────────────────────────────────────────────
function RichTextEditor({
  value, onChange, placeholder = 'Escribe el contenido aquí...'
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncContent();
  };

  const syncContent = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // Sync external value → DOM only on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []); // eslint-disable-line

  const toolbarBtn = (label: string, icon: React.ReactNode, action: () => void) => (
    <button
      type="button"
      title={label}
      onMouseDown={e => { e.preventDefault(); action(); }}
      className="p-1.5 rounded hover:bg-muted transition-colors text-foreground/70 hover:text-foreground"
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-muted/40 border-b border-border">
        {toolbarBtn('Negrita', <Bold className="h-3.5 w-3.5" />, () => exec('bold'))}
        {toolbarBtn('Cursiva', <Italic className="h-3.5 w-3.5" />, () => exec('italic'))}
        {toolbarBtn('Subrayado', <Underline className="h-3.5 w-3.5" />, () => exec('underline'))}
        <div className="w-px h-4 bg-border mx-1" />
        {toolbarBtn('Lista', <List className="h-3.5 w-3.5" />, () => exec('insertUnorderedList'))}
        {toolbarBtn('Centrar', <AlignCenter className="h-3.5 w-3.5" />, () => exec('justifyCenter'))}
        {toolbarBtn('Izquierda', <AlignL className="h-3.5 w-3.5" />, () => exec('justifyLeft'))}
        <div className="w-px h-4 bg-border mx-1" />
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => exec('fontSize', e.target.value)}
          className="text-xs bg-background border border-border rounded px-1 py-0.5 h-6"
          defaultValue="3"
        >
          <option value="1">Pequeño</option>
          <option value="3">Normal</option>
          <option value="4">Mediano</option>
          <option value="5">Grande</option>
          <option value="6">Muy grande</option>
        </select>
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { exec('foreColor', e.target.value); }}
          className="text-xs bg-background border border-border rounded px-1 py-0.5 h-6 w-16"
          title="Color de texto"
          defaultValue=""
        >
          <option value="" disabled>Color</option>
          <option value="#000000">Negro</option>
          <option value="#1e40af">Azul</option>
          <option value="#15803d">Verde</option>
          <option value="#dc2626">Rojo</option>
          <option value="#7c3aed">Morado</option>
          <option value="#ea580c">Naranja</option>
          <option value="#6b7280">Gris</option>
        </select>
        {toolbarBtn('Quitar formato', <Type className="h-3.5 w-3.5" />, () => exec('removeFormat'))}
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[100px] max-h-[300px] overflow-y-auto p-3 text-sm outline-none focus:ring-1 focus:ring-primary/30',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none'
        )}
      />
    </div>
  );
}

// ─── File Upload Zone ─────────────────────────────────────────────────────────
function FileUploadZone({
  materialType, value, fileName, onChange,
}: {
  materialType: StageMaterialType;
  value: string | null;
  fileName: string | null;
  onChange: (url: string | null, name: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cfg = MATERIAL_TYPE_CONFIG[materialType];

  const upload = useCallback(async (file: File) => {
    setErr(null);
    if (file.size > 200 * 1024 * 1024) { setErr('El archivo es muy grande (máx. 200 MB)'); return; }
    setUploading(true); setProgress(5);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `stages/${materialType}/${Date.now()}_${safe}`;
      const iv = setInterval(() => setProgress(p => Math.min(p + 8, 88)), 400);
      const { data, error } = await supabase.storage
        .from('unit-media')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      clearInterval(iv);
      if (error) { setErr(`Error: ${error.message}`); setUploading(false); return; }
      const { data: u } = supabase.storage.from('unit-media').getPublicUrl(data.path);
      setProgress(100);
      onChange(u.publicUrl, file.name);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al subir archivo');
    } finally { setUploading(false); }
  }, [materialType, onChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  const handleDelete = async () => {
    if (value) {
      const p = value.split('/unit-media/')[1];
      if (p) await supabase.storage.from('unit-media').remove([decodeURIComponent(p)]);
    }
    onChange(null, null);
  };

  // ── Already uploaded ──
  if (value && !uploading) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
          {materialType === 'image' && (
            <img src={value} alt="" className="w-full max-h-52 object-contain" />
          )}
          {materialType === 'video' && (
            <video src={value} controls className="w-full max-h-52 bg-black" />
          )}
          {materialType === 'audio' && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Music className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">{fileName || 'Audio'}</p>
                  <p className="text-xs text-green-600">Listo para reproducir</p>
                </div>
              </div>
              <audio src={value} controls className="w-full" />
            </div>
          )}
          {['pdf', 'word', 'ppt'].includes(materialType) && (
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 text-2xl">
                {cfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{fileName || 'Archivo'}</p>
                <p className="text-xs text-muted-foreground">{cfg.label} · Subido correctamente ✅</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.open(value, '_blank')} className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button" variant="outline" size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reemplazar archivo
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" /> Quitar
          </Button>
        </div>
        <input ref={inputRef} type="file" accept={cfg.accept} className="hidden" onChange={handleFileInput} />
      </div>
    );
  }

  // ── Upload zone ──
  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={cfg.accept} className="hidden" onChange={handleFileInput} />

      {uploading ? (
        <div className="border-2 border-primary/40 border-dashed rounded-xl p-6 text-center bg-primary/5">
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
          <p className="text-sm font-medium text-primary">Subiendo archivo...</p>
          <div className="mt-3 bg-primary/20 rounded-full h-2 max-w-[200px] mx-auto overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
            drag
              ? 'border-primary bg-primary/8 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/40'
          )}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-2xl">
            {cfg.emoji}
          </div>
          <p className="text-sm font-semibold mb-1">
            Arrastra el archivo aquí
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            o haz clic para seleccionar
          </p>
          <Button type="button" size="sm" className="gap-2 pointer-events-none">
            <Upload className="h-3.5 w-3.5" />
            Seleccionar {cfg.label}
          </Button>
          <p className="text-[11px] text-muted-foreground mt-2">
            Formatos: {cfg.accept.replace(/\./g, '').toUpperCase()} · Máx. 200 MB
          </p>
        </div>
      )}

      {err && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          ⚠️ {err}
        </div>
      )}
    </div>
  );
}

// ─── Material Card (expanded editor) ─────────────────────────────────────────
function MaterialCard({
  material, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  material: UnitStageMaterial;
  onUpdate: (patch: Partial<UnitStageMaterial>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const cfg = MATERIAL_TYPE_CONFIG[material.material_type];
  const ytThumb = material.external_url ? getYouTubeThumbnail(material.external_url) : null;
  const embedSrc = material.external_url ? getEmbedUrl(material.external_url) : null;
  const [previewEmbed, setPreviewEmbed] = useState(false);

  return (
    <div className="border-2 border-border rounded-2xl bg-card shadow-sm overflow-hidden">
      {/* ── Card Header ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
        <span className="text-lg">{cfg.emoji}</span>
        <span className="text-sm font-bold flex-1">{cfg.label}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp} disabled={isFirst}
            className="p-1 rounded hover:bg-background disabled:opacity-30 transition-colors"
            title="Subir"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown} disabled={isLast}
            className="p-1 rounded hover:bg-background disabled:opacity-30 transition-colors"
            title="Bajar"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onUpdate({ is_published: !material.is_published })}
            className={cn(
              'p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors',
              material.is_published
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            title={material.is_published ? 'Visible · clic para ocultar' : 'Oculto · clic para publicar'}
          >
            {material.is_published
              ? <><Eye className="h-3 w-3" /> Visible</>
              : <><EyeOff className="h-3 w-3" /> Oculto</>
            }
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 space-y-4">
        {/* Título */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Título
          </label>
          <Input
            value={material.title}
            onChange={e => onUpdate({ title: e.target.value })}
            placeholder={`Ej: ${cfg.label} - Lección 1`}
            className="h-9 font-medium"
          />
        </div>

        {/* Archivo / URL / Texto */}
        {cfg.isFile && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Archivo {cfg.label}
            </label>
            <FileUploadZone
              materialType={material.material_type}
              value={material.file_url}
              fileName={material.file_name}
              onChange={(url, name) => onUpdate({ file_url: url, file_name: name })}
            />
          </div>
        )}

        {material.material_type === 'url' && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              URL del enlace
            </label>
            <Input
              value={material.external_url || ''}
              onChange={e => onUpdate({ external_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... o cualquier URL"
              className="h-9"
            />
            {/* YouTube preview */}
            {material.external_url && ytThumb && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border bg-black">
                {!previewEmbed ? (
                  <div className="relative cursor-pointer group" onClick={() => setPreviewEmbed(true)}>
                    <img src={ytThumb} alt="YouTube preview" className="w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                      <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <Film className="h-6 w-6 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-3 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                      Clic para reproducir
                    </div>
                  </div>
                ) : embedSrc ? (
                  <iframe src={embedSrc} className="w-full aspect-video" allowFullScreen />
                ) : null}
              </div>
            )}
            {material.external_url && !ytThumb && (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate flex-1">{material.external_url}</p>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => window.open(material.external_url!, '_blank')}>
                  <ExternalLink className="h-3 w-3" /> Abrir
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Texto enriquecido */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
            {material.material_type === 'text' ? 'Contenido del texto' : 'Descripción / Notas (opcional)'}
          </label>
          <RichTextEditor
            value={material.description || ''}
            onChange={v => onUpdate({ description: v })}
            placeholder={
              material.material_type === 'text'
                ? 'Escribe el contenido aquí. Puedes usar negrita, listas, colores...'
                : 'Descripción o instrucciones para el estudiante (opcional)'
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Add material picker ──────────────────────────────────────────────────────
function AddMaterialPicker({ onAdd }: { onAdd: (type: StageMaterialType) => void }) {
  const types: StageMaterialType[] = ['audio', 'video', 'pdf', 'word', 'ppt', 'image', 'url', 'text'];
  return (
    <div className="border-2 border-dashed border-primary/30 rounded-2xl p-4 bg-primary/3">
      <p className="text-xs font-semibold text-center text-muted-foreground mb-3 uppercase tracking-wide">
        ¿Qué tipo de material quieres agregar?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {types.map(type => {
          const cfg = MATERIAL_TYPE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cfg.emoji}</span>
              <span className="text-[10px] font-semibold leading-none text-muted-foreground group-hover:text-foreground">{cfg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quiz Types ──────────────────────────────────────────────────────────────
export type QuizType = 'multiple_choice' | 'multiple_select' | 'true_false' | 'match' | 'organize' | 'rewrite' | 'fill_gap' | 'listen_select' | 'listen_write' | 'image_choice';

export interface QuizOption { id: string; text: string; isCorrect?: boolean; correctAnswer?: string; }
export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  imageUrl?: string;
}

const QUIZ_TYPE_CONFIG: Record<QuizType, { label: string; emoji: string; desc: string }> = {
  multiple_choice:  { label: 'Opción múltiple',       emoji: '🔘', desc: 'Una sola respuesta correcta' },
  multiple_select:  { label: 'Varios correctos',       emoji: '☑️', desc: 'Puede haber más de una correcta' },
  true_false:       { label: 'Verdadero / Falso',      emoji: '⚖️', desc: 'Solo dos opciones' },
  match:            { label: 'Relacionar (Match)',      emoji: '🔗', desc: 'Conectar columna A con columna B' },
  organize:         { label: 'Organizar palabras',      emoji: '🔀', desc: 'Reordenar palabras o frases' },
  rewrite:          { label: 'Reescribir correctamente', emoji: '✍️', desc: 'Corregir una oración' },
  fill_gap:         { label: 'Fill the Gap',            emoji: '✏️', desc: 'Completa el espacio en blanco' },
  listen_select:    { label: 'Escucha y selecciona',    emoji: '🔊', desc: 'Escucha la palabra y elige la opción correcta' },
  listen_write:     { label: 'Escucha y escribe',       emoji: '🎧', desc: 'Escucha la palabra y escríbela' },
  image_choice:     { label: 'Imagen + opción múltiple', emoji: '🖼️', desc: 'Muestra una imagen y elige la opción correcta' },
};

// Fallback seguro: nunca crashea con tipos desconocidos (ej: 'listen' legacy)
const FALLBACK_CONFIG = { label: 'Desconocido', emoji: '❓', desc: '' };
const getQTConfig = (type: string) =>
  (QUIZ_TYPE_CONFIG as Record<string, { label: string; emoji: string; desc: string }>)[type] ?? FALLBACK_CONFIG;

// ── Interactive Quiz Preview ──────────────────────────────────────────────────
function QuizPreview({ questions, onClose }: { questions: QuizQuestion[]; onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean; selected: string[] }[]>([]);
  const [finished, setFinished] = useState(false);
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const q = questions[current];
  if (!q) return null;

  const isMultiSelect = q.type === 'multiple_select';
  const isTextInput = q.type === 'organize' || q.type === 'rewrite';
  const isMatch = q.type === 'match';
  const isFillGap = q.type === 'fill_gap';
  const isListenSelect = q.type === 'listen_select';
  const isListenWrite = q.type === 'listen_write';
  const isListen = isListenSelect || isListenWrite;
  const isImageChoice = q.type === 'image_choice';

  const handleSelect = (optId: string) => {
    if (submitted) return;
    if (isMultiSelect) {
      setSelected(s => s.includes(optId) ? s.filter(x => x !== optId) : [...s, optId]);
    } else {
      setSelected([optId]);
    }
  };

  const handleMatchSelect = (leftId: string, rightText: string) => {
    if (submitted) return;
    setMatchPairs(p => ({ ...p, [leftId]: rightText }));
  };

  const checkAnswer = () => {
    let correct = false;
    if (isTextInput || isFillGap) {
      const userAns = inputVal.trim().toLowerCase().replace(/[.,!?]/g, '');
      const correctAns = (q.correctAnswer || '').toLowerCase().replace(/[.,!?]/g, '');
      correct = userAns === correctAns;
    } else if (isListenWrite) {
      const userAns = inputVal.trim().toLowerCase().replace(/[.,!?]/g, '');
      const correctAns = q.question.trim().toLowerCase().replace(/[.,!?]/g, '');
      correct = userAns === correctAns;
    } else if (isMatch) {
      correct = q.options.every(opt => matchPairs[opt.id] === opt.correctAnswer);
    } else {
      const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id);
      if (isMultiSelect) {
        correct = correctIds.length === selected.length && correctIds.every(id => selected.includes(id));
      } else {
        correct = selected.length === 1 && correctIds.includes(selected[0]);
      }
    }
    setSubmitted(true);
    const newAnswers = [...answers, { correct, selected: (isTextInput || isFillGap || isListenWrite) ? [inputVal] : selected }];
    setAnswers(newAnswers);
    if (correct) setScore(s => s + 1);
  };

  const goNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected([]);
      setInputVal('');
      setMatchPairs({});
      setSubmitted(false);
    }
  };

  const restart = () => {
    setCurrent(0); setSelected([]); setInputVal(''); setMatchPairs({});
    setSubmitted(false); setScore(0); setAnswers([]); setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">{pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-extrabold mb-1">Resultado</h2>
          <p className="text-4xl font-black text-primary mb-2">{score}/{questions.length}</p>
          <p className="text-lg font-bold mb-1">{pct}%</p>
          <p className="text-muted-foreground text-sm mb-6">
            {pct >= 70 ? '¡Excelente trabajo! 🌟' : pct >= 40 ? '¡Buen intento! Sigue practicando.' : '¡No te rindas! Puedes mejorar.'}
          </p>
          <div className="flex gap-3">
            <button onClick={restart} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">🔁 Repetir</button>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm">✕ Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  const rightOptions = isMatch ? [...q.options].sort(() => Math.random() - 0.5) : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-2xl max-w-lg w-full my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{current + 1}/{questions.length}</span>
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{getQTConfig(q.type).emoji} {getQTConfig(q.type).label}</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Question */}
          {isListen ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                onClick={() => {
                  if (!('speechSynthesis' in window)) return;
                  window.speechSynthesis.cancel();
                  const u = new SpeechSynthesisUtterance(q.question);
                  u.lang = 'en-US'; u.rate = 0.85;
                  const trySpeak = () => {
                    const vs = window.speechSynthesis.getVoices();
                    const v = vs.find(x => x.lang === 'en-US') || vs.find(x => x.lang.startsWith('en'));
                    if (v) u.voice = v;
                    window.speechSynthesis.speak(u);
                  };
                  if (window.speechSynthesis.getVoices().length > 0) trySpeak();
                  else { window.speechSynthesis.onvoiceschanged = () => { trySpeak(); window.speechSynthesis.onvoiceschanged = null; }; }
                }}
                className="w-20 h-20 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-95 flex items-center justify-center shadow-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
              </button>
              <p className="text-xs text-muted-foreground font-medium">Presiona para escuchar</p>
              {submitted && <p className="text-xs text-muted-foreground italic">Palabra: <strong>{q.question}</strong></p>}
            </div>
          ) : isImageChoice ? (
            <div className="space-y-3">
              {q.question && <p className="font-bold text-base leading-snug">{q.question}</p>}
              {q.imageUrl && (
                <>
                  {lightboxOpen && (
                    <div
                      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                      onClick={() => setLightboxOpen(false)}
                    >
                      <button
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl font-bold"
                        onClick={() => setLightboxOpen(false)}
                      >✕</button>
                      <img
                        src={q.imageUrl}
                        alt="Imagen ampliada"
                        className="max-h-[90vh] max-w-[95vw] object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div
                    className="relative rounded-2xl overflow-hidden border-2 border-border bg-muted/20 cursor-zoom-in group"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img src={q.imageUrl} alt="Imagen de la pregunta" className="max-h-60 w-full object-contain transition-transform group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                      <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">🔍 Ampliar imagen</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="font-bold text-base leading-snug">{q.question}</p>
          )}

          {/* Options: multiple_choice / multiple_select / true_false / listen / image_choice */}
          {(q.type === 'multiple_choice' || q.type === 'multiple_select' || q.type === 'true_false' || q.type === 'listen_select' || q.type === 'image_choice') && (
            <div className="space-y-2">
              {q.options.map(opt => {
                const isSelected = selected.includes(opt.id);
                const showResult = submitted;
                const bg = showResult
                  ? opt.isCorrect ? 'bg-green-50 border-green-400 text-green-800'
                    : isSelected && !opt.isCorrect ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-muted/30 border-border text-muted-foreground'
                  : isSelected ? 'bg-primary/10 border-primary text-foreground'
                  : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer';
                return (
                  <button key={opt.id} onClick={() => handleSelect(opt.id)} disabled={submitted}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${bg}`}>
                    <div className={`w-5 h-5 rounded shrink-0 border-2 flex items-center justify-center ${
                      showResult ? opt.isCorrect ? 'bg-green-500 border-green-500' : isSelected ? 'bg-red-400 border-red-400' : 'border-muted-foreground'
                      : isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                      {(isSelected || (showResult && opt.isCorrect)) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{opt.text}</span>
                    {showResult && opt.isCorrect && <span className="ml-auto text-green-600 text-xs font-bold">✓ Correcto</span>}
                    {showResult && isSelected && !opt.isCorrect && <span className="ml-auto text-red-500 text-xs font-bold">✗ Incorrecto</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Match */}
          {isMatch && (
            <div className="space-y-2">
              {q.options.map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <div className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-medium ${
                    submitted ? opt.correctAnswer === matchPairs[opt.id] ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50' : 'border-border bg-muted/30'
                  }`}>{opt.text}</div>
                  <span className="text-muted-foreground">→</span>
                  <select disabled={submitted} value={matchPairs[opt.id] || ''}
                    onChange={e => handleMatchSelect(opt.id, e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm focus:outline-none ${
                      submitted ? opt.correctAnswer === matchPairs[opt.id] ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50' : 'border-border bg-background'
                    }`}>
                    <option value="">Selecciona...</option>
                    {[...new Set(q.options.map(o => o.correctAnswer))].filter(Boolean).sort(() => Math.random() - 0.5).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {submitted && <span>{opt.correctAnswer === matchPairs[opt.id] ? '✅' : '❌'}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Organize / Rewrite */}
          {isTextInput && (
            <div className="space-y-3">
              {q.type === 'organize' && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-sm font-mono text-violet-800">
                  📝 {q.options[0]?.text}
                </div>
              )}
              {q.type === 'rewrite' && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-mono text-red-700 line-through">
                  ✗ {q.options[0]?.text}
                </div>
              )}
              <input value={inputVal} onChange={e => setInputVal(e.target.value)} disabled={submitted}
                placeholder="Escribe tu respuesta aquí..."
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                  submitted ? answers[answers.length - 1]?.correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50' : 'border-border focus:border-primary'
                }`} />
              {submitted && (
                <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                  answers[answers.length - 1]?.correct ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {answers[answers.length - 1]?.correct ? '✅ ¡Correcto!' : `❌ La respuesta correcta es: "${q.correctAnswer}"`}
                </div>
              )}
            </div>
          )}

          {/* Fill the Gap */}
          {isFillGap && (() => {
            const parts = q.question.split('___');
            return (
              <div className="space-y-3">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-4 text-sm leading-relaxed">
                  {parts.map((part, i) => (
                    <span key={i}>{part}{i < parts.length - 1 && (
                      <span className="inline-block mx-1">
                        <input value={inputVal} onChange={e => setInputVal(e.target.value)} disabled={submitted}
                          placeholder="______"
                          className={`border-b-2 border-dashed px-2 py-0.5 text-sm font-semibold bg-transparent focus:outline-none w-28 text-center ${
                            submitted ? answers[answers.length-1]?.correct ? 'border-green-500 text-green-700' : 'border-red-400 text-red-600' : 'border-amber-500'
                          }`} />
                      </span>
                    )}
                    </span>
                  ))}
                </div>
                {submitted && (
                  <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                    answers[answers.length-1]?.correct ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {answers[answers.length-1]?.correct ? '✅ ¡Correcto!' : `❌ La respuesta correcta es: "${q.correctAnswer}"`}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Listen Write: campo para escribir */}
          {isListenWrite && (
            <div className="space-y-3">
              <input value={inputVal} onChange={e => setInputVal(e.target.value)} disabled={submitted}
                placeholder="Escribe lo que escuchaste..."
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                  submitted ? answers[answers.length-1]?.correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50' : 'border-border focus:border-primary'
                }`} />
              {submitted && (
                <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                  answers[answers.length-1]?.correct ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {answers[answers.length-1]?.correct ? '✅ ¡Correcto!' : `❌ La respuesta correcta es: "${q.question}"`}
                </div>
              )}
            </div>
          )}

          {/* Explanation after submit */}
          {submitted && q.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              💡 <strong>Explicación:</strong> {q.explanation}
            </div>
          )}

          {/* Result summary */}
          {submitted && !isTextInput && !isFillGap && !isListenWrite && q.type !== 'image_choice' && (
            <div className={`rounded-xl px-4 py-2.5 text-sm font-bold text-center ${
              answers[answers.length - 1]?.correct ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {answers[answers.length - 1]?.correct ? '✅ ¡Respuesta correcta!' : '❌ Respuesta incorrecta'}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-5 pb-5 flex gap-3">
          {!submitted ? (
            <button onClick={checkAnswer}
              disabled={(isTextInput || isFillGap || isListenWrite) ? !inputVal.trim() : isMatch ? Object.keys(matchPairs).length < q.options.length : selected.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              Comprobar ✓
            </button>
          ) : (
            <button onClick={goNext} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              {current + 1 >= questions.length ? '🏁 Ver resultado' : 'Siguiente →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quiz Editor (Manual) ─────────────────────────────────────────────────────
function QuizEditor({ unitId, stage }: { unitId: string; stage: Stage; stageLabel?: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [savingQ, setSavingQ] = useState(false);
  const [savedQ, setSavedQ] = useState(false);
  const [saveErrQ, setSaveErrQ] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeQ, setActiveQ] = useState<string | null>(null);
  // New question form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<QuizType>('multiple_choice');
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formCorrect, setFormCorrect] = useState<number[]>([0]);
  const [formAnswer, setFormAnswer] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formPairs, setFormPairs] = useState([{left:'',right:''},{left:'',right:''},{left:'',right:''},{left:'',right:''}]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Load quiz from DB on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingQ(true);
    supabase
      .from('unit_stage_quizzes')
      .select('questions')
      .eq('unit_id', unitId)
      .eq('stage', stage)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Error loading quiz:', error);
        setQuestions(data?.questions ?? []);
        setLoadingQ(false);
      });
    return () => { cancelled = true; };
  }, [unitId, stage]);

  // Save quiz via UPSERT (atomic, no race conditions)
  const saveQuiz = async (qs: QuizQuestion[]) => {
    setSavingQ(true); setSaveErrQ(null);
    console.log('[QuizEditor] saveQuiz START — questions:', qs.length, '| unitId:', unitId, '| stage:', stage);
    try {
      // Check auth session first
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw new Error('Auth session error: ' + sessionErr.message);
      if (!session) throw new Error('No active session — please log in again');
      console.log('[QuizEditor] auth user:', session.user.email);

      if (qs.length === 0) {
        // Just delete if clearing
        const delRes = await supabase
          .from('unit_stage_quizzes')
          .delete()
          .eq('unit_id', unitId)
          .eq('stage', stage);
        console.log('[QuizEditor] delete (clear) result:', delRes.error ? JSON.stringify(delRes.error) : 'OK');
        if (delRes.error) throw delRes.error;
      } else {
        // UPSERT — insert or update on conflict (unit_id, stage)
        const upsertRes = await supabase
          .from('unit_stage_quizzes')
          .upsert(
            { unit_id: unitId, stage, questions: qs, updated_at: new Date().toISOString() },
            { onConflict: 'unit_id,stage' }
          );
        console.log('[QuizEditor] upsert result:', upsertRes.error ? JSON.stringify(upsertRes.error) : 'OK');
        if (upsertRes.error) throw upsertRes.error;
      }

      console.log('[QuizEditor] saveQuiz SUCCESS ✅');
      setSavedQ(true);
      setTimeout(() => setSavedQ(false), 6000);
    } catch (e) {
      const errObj = e as { message?: string; code?: string; details?: string; hint?: string };
      const msg = errObj.message || JSON.stringify(e);
      const detail = errObj.details ? ` | ${errObj.details}` : '';
      const hint = errObj.hint ? ` | Hint: ${errObj.hint}` : '';
      const code = errObj.code ? ` [${errObj.code}]` : '';
      const fullMsg = `${msg}${detail}${hint}${code}`;
      console.error('[QuizEditor] saveQuiz ERROR ❌:', fullMsg, e);
      setSaveErrQ(fullMsg);
    } finally { setSavingQ(false); }
  };

  // ── Reset form helpers ──
  const resetForm = () => {
    setFormQuestion(''); setFormOptions(['','','','']); setFormCorrect([0]);
    setFormAnswer(''); setFormExplanation('');
    setFormPairs([{left:'',right:''},{left:'',right:''},{left:'',right:''},{left:'',right:''}]);
    setFormError(null); setEditingId(null);
  };

  const openNewForm = () => { resetForm(); setFormType('multiple_choice'); setShowForm(true); };

  const openEditForm = (q: QuizQuestion) => {
    setEditingId(q.id);
    setFormType(q.type);
    setFormQuestion(q.question);
    setFormExplanation(q.explanation ?? '');
    if (q.type === 'match') {
      setFormPairs(q.options.map(o => ({ left: o.text, right: o.correctAnswer ?? '' })));
    } else if (q.type === 'organize' || q.type === 'rewrite') {
      setFormOptions([q.options[0]?.text ?? '', '', '', '']);
      setFormAnswer(q.correctAnswer ?? '');
    } else {
      setFormOptions(q.options.map(o => o.text).concat(['','','','']).slice(0, 4));
      setFormCorrect(q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i >= 0));
    }
    setShowForm(true);
    setActiveQ(null);
  };

  const submitForm = () => {
    setFormError(null);
    if (!formQuestion.trim()) { setFormError('Escribe la pregunta.'); return; }
    const id = editingId ?? `q-manual-${Date.now()}`;
    let newQ: QuizQuestion;

    if (formType === 'match') {
      const validPairs = formPairs.filter(p => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) { setFormError('Agrega al menos 2 pares.'); return; }
      newQ = { id, type: 'match', question: formQuestion,
        options: validPairs.map((p, pi) => ({ id: `opt-${id}-${pi}`, text: p.left, isCorrect: true, correctAnswer: p.right })),
        explanation: formExplanation };
    } else if (formType === 'organize' || formType === 'rewrite') {
      if (!formOptions[0].trim()) { setFormError(formType === 'organize' ? 'Escribe las palabras desordenadas.' : 'Escribe la oración incorrecta.'); return; }
      if (!formAnswer.trim()) { setFormError('Escribe la respuesta correcta.'); return; }
      newQ = { id, type: formType, question: formQuestion,
        options: [{ id: `opt-${id}-0`, text: formOptions[0], isCorrect: true }],
        correctAnswer: formAnswer, explanation: formExplanation };
    } else {
      const opts = formOptions.filter(o => o.trim());
      if (opts.length < 2) { setFormError('Agrega al menos 2 opciones.'); return; }
      if (formCorrect.length === 0) { setFormError('Marca al menos una respuesta correcta.'); return; }
      newQ = { id, type: formType, question: formQuestion,
        options: opts.map((text, oi) => ({ id: `opt-${id}-${oi}`, text, isCorrect: formCorrect.includes(oi) })),
        explanation: formExplanation };
    }

    const updated = editingId
      ? questions.map(q => q.id === editingId ? newQ : q)
      : [...questions, newQ];
    setQuestions(updated);
    saveQuiz(updated);
    resetForm();
    setShowForm(false);
  };

  const deleteQ = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    if (activeQ === id) setActiveQ(null);
    // Persist deletion immediately
    saveQuiz(updated);
  };

  if (loadingQ) return <div className="py-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-violet-500" /></div>;

  return (
    <div className="space-y-3">
      {/* Interactive preview modal */}
      {showPreview && questions.length > 0 && (
        <QuizPreview questions={questions} onClose={() => setShowPreview(false)} />
      )}

      {/* ── Toolbar: añadir pregunta + probar quiz ── */}
      <div className="flex items-center gap-2">
        <Button type="button" onClick={openNewForm}
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm">
          <Plus className="h-4 w-4" /> Agregar pregunta
        </Button>
        {questions.length > 0 && (
          <Button type="button" onClick={() => setShowPreview(true)} variant="outline"
            className="gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-100 rounded-xl text-sm">
            🎮 Probar quiz
          </Button>
        )}
        {savedQ && <span className="text-xs text-green-700 flex items-center gap-1"><Check className="h-3 w-3" /> Guardado</span>}
        {saveErrQ && <span className="text-xs text-red-600">❌ {saveErrQ.slice(0,60)}</span>}
      </div>

      {/* ── Formulario nueva/editar pregunta ── */}
      {showForm && (
        <div className="border-2 border-violet-200 rounded-2xl p-4 space-y-3 bg-violet-50">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-violet-900 flex items-center gap-2">
              <PenLine className="h-4 w-4" /> {editingId ? 'Editar pregunta' : 'Nueva pregunta'}
            </p>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold text-violet-700 mb-1 block">Tipo de pregunta</label>
            <select value={formType} onChange={e => { setFormType(e.target.value as QuizType); setFormError(null); }}
              className="w-full text-xs border border-violet-200 rounded-xl px-2 py-1.5 bg-white focus:ring-2 focus:ring-violet-300 outline-none">
              {(Object.entries(QUIZ_TYPE_CONFIG) as [QuizType, typeof QUIZ_TYPE_CONFIG[QuizType]][]).map(([t, c]) => (
                <option key={t} value={t}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Pregunta */}
          <div>
            <label className="text-xs font-semibold text-violet-700 mb-1 block">Pregunta *</label>
            <Input value={formQuestion} onChange={e => setFormQuestion(e.target.value)}
              placeholder="Escribe la pregunta aquí..." className="text-sm border-violet-200 bg-white" />
          </div>

          {/* Opciones según tipo */}
          {(formType === 'multiple_choice' || formType === 'multiple_select' || formType === 'true_false') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-violet-700 block">
                Opciones — {formType === 'multiple_select' ? 'marca todas las correctas' : 'marca la correcta'}
              </label>
              {(formType === 'true_false' ? ['Verdadero', 'Falso'] : formOptions).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type={formType === 'multiple_select' ? 'checkbox' : 'radio'}
                    name="correct" checked={formCorrect.includes(oi)}
                    onChange={() => {
                      if (formType === 'multiple_select') {
                        setFormCorrect(prev => prev.includes(oi) ? prev.filter(x => x !== oi) : [...prev, oi]);
                      } else {
                        setFormCorrect([oi]);
                      }
                    }}
                    className="accent-violet-600 shrink-0" />
                  {formType === 'true_false'
                    ? <span className="text-sm">{opt}</span>
                    : <Input value={opt} onChange={e => {
                        const arr = [...formOptions]; arr[oi] = e.target.value; setFormOptions(arr);
                      }} placeholder={`Opción ${oi + 1}`} className="text-xs border-violet-200 bg-white h-8" />
                  }
                </div>
              ))}
            </div>
          )}

          {formType === 'match' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-violet-700 block">Pares (Columna A → Columna B)</label>
              {formPairs.map((pair, pi) => (
                <div key={pi} className="grid grid-cols-2 gap-2">
                  <Input value={pair.left} onChange={e => { const arr=[...formPairs]; arr[pi]={...arr[pi],left:e.target.value}; setFormPairs(arr); }}
                    placeholder={`A${pi+1}`} className="text-xs border-violet-200 bg-white h-8" />
                  <Input value={pair.right} onChange={e => { const arr=[...formPairs]; arr[pi]={...arr[pi],right:e.target.value}; setFormPairs(arr); }}
                    placeholder={`B${pi+1}`} className="text-xs border-violet-200 bg-white h-8" />
                </div>
              ))}
            </div>
          )}

          {(formType === 'organize' || formType === 'rewrite') && (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-semibold text-violet-700 mb-1 block">
                  {formType === 'organize' ? 'Palabras desordenadas' : 'Oración incorrecta'}
                </label>
                <Input value={formOptions[0]} onChange={e => { const arr=[...formOptions]; arr[0]=e.target.value; setFormOptions(arr); }}
                  placeholder={formType === 'organize' ? 'Ej: coffee drink I morning every' : 'Ej: She dont like coffee'}
                  className="text-xs border-violet-200 bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-violet-700 mb-1 block">Respuesta correcta</label>
                <Input value={formAnswer} onChange={e => setFormAnswer(e.target.value)}
                  placeholder={formType === 'organize' ? 'Ej: I drink coffee every morning' : 'Ej: She doesn\'t like coffee'}
                  className="text-xs border-violet-200 bg-white" />
              </div>
            </div>
          )}

          {/* Explicación */}
          <div>
            <label className="text-xs font-semibold text-violet-700 mb-1 block">Explicación <span className="font-normal text-violet-400">(opcional)</span></label>
            <Input value={formExplanation} onChange={e => setFormExplanation(e.target.value)}
              placeholder="Breve explicación de la respuesta correcta..." className="text-xs border-violet-200 bg-white" />
          </div>

          {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" onClick={submitForm} disabled={savingQ}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm gap-1.5">
              {savingQ ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Check className="h-4 w-4" /> {editingId ? 'Guardar cambios' : 'Agregar pregunta'}</>}
            </Button>
            <Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false); }}
              className="border-violet-200 text-violet-700 rounded-xl text-sm">Cancelar</Button>
          </div>
        </div>
      )}

      {/* ── Lista de preguntas ── */}
      {questions.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{questions.length} pregunta{questions.length !== 1 ? 's' : ''}</p>
            <button type="button" onClick={() => { setQuestions([]); saveQuiz([]); }} className="text-xs text-destructive/70 hover:text-destructive">Limpiar todo</button>
          </div>
          {questions.map((q, qi) => (
            <div key={q.id} className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
              <button type="button" onClick={() => setActiveQ(activeQ === q.id ? null : q.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                <span className="text-sm w-6 shrink-0 text-center font-bold text-primary">{qi + 1}</span>
                <span className="text-base shrink-0">{getQTConfig(q.type).emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{getQTConfig(q.type).label}</p>
                  <p className="text-xs text-foreground truncate">{q.question || 'Sin pregunta...'}</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); openEditForm(q); }}
                  className="p-1 rounded hover:bg-violet-100 text-violet-500 hover:text-violet-700 shrink-0">
                  <PenLine className="h-3 w-3" />
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); deleteQ(q.id); }}
                  className="p-1 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
                {activeQ === q.id ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              </button>
              {activeQ === q.id && (
                <div className="px-3 py-2.5 space-y-1 border-t border-border/50 bg-muted/10">
                  {q.options.map(opt => (
                    <div key={opt.id} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${opt.isCorrect ? 'bg-green-50 text-green-800' : 'text-muted-foreground'}`}>
                      {opt.isCorrect ? <Check className="h-3 w-3 text-green-600 shrink-0" /> : <span className="w-3 h-3 rounded border border-muted-foreground/30 shrink-0 inline-block" />}
                      <span>{opt.text}{opt.correctAnswer ? ` → ${opt.correctAnswer}` : ''}</span>
                    </div>
                  ))}
                  {(q.correctAnswer && !q.options.some(o => o.correctAnswer)) && (
                    <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1.5 flex items-center gap-1"><Check className="h-3 w-3" /> {q.correctAnswer}</p>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-2 py-1.5">💡 {q.explanation}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {questions.length === 0 && !showForm && (
        <p className="text-xs text-center text-muted-foreground py-3">No hay preguntas aún. Haz clic en "Agregar pregunta" para comenzar.</p>
      )}
    </div>
  );
}

// ─── Stage Panel ──────────────────────────────────────────────────────────────
function StagePanel({
  stage, unitId, materials, onMaterialsChange, isExpanded, onToggle,
}: {
  stage: typeof STAGES[0];
  unitId: string;
  materials: UnitStageMaterial[];
  onMaterialsChange: (updated: UnitStageMaterial[]) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const addMaterial = (type: StageMaterialType) => {
    const newMat: UnitStageMaterial = {
      id: `tmp-${Date.now()}`,
      unit_id: unitId,
      stage: stage.id,
      material_type: type,
      title: '',
      description: '',
      file_url: null,
      file_name: null,
      external_url: null,
      sort_order: materials.length,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onMaterialsChange([...materials, newMat]);
    setShowPicker(false);
  };

  const updateMaterial = (id: string, patch: Partial<UnitStageMaterial>) =>
    onMaterialsChange(materials.map(m => m.id === id ? { ...m, ...patch } : m));

  const deleteMaterial = (id: string) =>
    onMaterialsChange(materials.filter(m => m.id !== id));

  const moveMaterial = (id: string, dir: 'up' | 'down') => {
    const i = materials.findIndex(m => m.id === id);
    if (i < 0) return;
    if (dir === 'up' && i === 0) return;
    if (dir === 'down' && i === materials.length - 1) return;
    const arr = [...materials];
    const j = dir === 'up' ? i - 1 : i + 1;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onMaterialsChange(arr);
  };

  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden', stage.bg)}>
      {/* Stage header — click to expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-black/5 transition-colors"
      >
        <span className="text-2xl">{stage.emoji}</span>
        <div className="flex-1">
          <p className={cn('font-bold text-base', stage.color)}>{stage.label}</p>
          <p className="text-xs text-muted-foreground">{stage.desc}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs">{materials.length} mat.</Badge>
        </div>
        {isExpanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Always mount content to avoid QuizEditor losing state on collapse */}
      <div className={isExpanded ? '' : 'hidden'}>
        <div className="border-t border-black/10">
          {/* Inner tabs: Materiales / Quiz */}
          <div className="flex border-b border-black/10">
            <button type="button"
              onClick={() => setShowQuiz(false)}
              className={cn('flex-1 py-2.5 text-xs font-bold transition-colors',
                !showQuiz ? `bg-white/80 ${stage.color}` : 'text-muted-foreground hover:bg-black/5')}>
              📁 Materiales
            </button>
            <button type="button"
              onClick={() => setShowQuiz(true)}
              className={cn('flex-1 py-2.5 text-xs font-bold transition-colors',
                showQuiz ? `bg-white/80 ${stage.color}` : 'text-muted-foreground hover:bg-black/5')}>
              📝 Quiz
            </button>
          </div>

          {/* Materials pane */}
          {!showQuiz && (
            <div className="px-4 pb-4 space-y-3 pt-4">
              {materials.length === 0 && !showPicker && (
                <p className="text-sm text-center text-muted-foreground py-2">Sin materiales aún — agrégalos usando el botón de abajo</p>
              )}
              {materials.map((mat, idx) => (
                <MaterialCard
                  key={mat.id}
                  material={mat}
                  onUpdate={patch => updateMaterial(mat.id, patch)}
                  onDelete={() => deleteMaterial(mat.id)}
                  onMoveUp={() => moveMaterial(mat.id, 'up')}
                  onMoveDown={() => moveMaterial(mat.id, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === materials.length - 1}
                />
              ))}
              {showPicker && <AddMaterialPicker onAdd={addMaterial} />}
              <Button type="button" variant="outline" size="sm"
                onClick={() => setShowPicker(s => !s)}
                className={cn('w-full h-10 text-sm gap-2 border-dashed', showPicker && 'border-primary/50 text-primary')}>
                {showPicker ? <><X className="h-4 w-4" /> Cancelar</> : <><Plus className="h-4 w-4" /> Agregar material</>}
              </Button>
            </div>
          )}

          {/* Quiz pane — always mounted to preserve state, just hidden */}
          <div className={showQuiz ? 'px-4 pb-4 pt-4' : 'hidden'}>
            <QuizEditor unitId={unitId} stage={stage.id} stageLabel={stage.label} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main UnitStagesEditor ─────────────────────────────────────────────────────
interface UnitStagesEditorProps {
  unitId: string;
  unitTitle: string;
  onClose: () => void;
}

export function UnitStagesEditor({ unitId, unitTitle, onClose }: UnitStagesEditorProps) {
  const [materialsByStage, setMaterialsByStage] = useState<Record<Stage, UnitStageMaterial[]>>({
    grammar: [], vocabulary: [], reading: [], listening: [], ai_practice: [],
  });
  const materialsRef = useRef<Record<Stage, UnitStageMaterial[]>>({
    grammar: [], vocabulary: [], reading: [], listening: [], ai_practice: [],
  });

  const [expandedStage, setExpandedStage] = useState<Stage | null>('grammar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => { loadMaterials(); }, [unitId]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('unit_stage_materials')
        .select('*')
        .eq('unit_id', unitId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const byStage: Record<Stage, UnitStageMaterial[]> = {
        grammar: [], vocabulary: [], reading: [], listening: [], ai_practice: [],
      };
      (data as UnitStageMaterial[]).forEach(m => {
        if (m.stage in byStage) byStage[m.stage as Stage].push(m);
      });
      setMaterialsByStage(byStage);
      materialsRef.current = byStage;
    } catch (e) {
      console.error('Error loading materials:', e);
    } finally { setLoading(false); }
  };

  const handleStageChange = (stage: Stage, updated: UnitStageMaterial[]) => {
    const next = { ...materialsRef.current, [stage]: updated };
    materialsRef.current = next;
    setMaterialsByStage({ ...next });
  };

  const save = async () => {
    setSaving(true); setSaveError(null);
    try {
      const { error: delErr } = await supabase
        .from('unit_stage_materials').delete().eq('unit_id', unitId);
      if (delErr) throw delErr;
      const allMaterials: Omit<UnitStageMaterial, 'id' | 'created_at' | 'updated_at'>[] = [];
      STAGES.forEach(({ id: stage }) => {
        materialsRef.current[stage].forEach((m, idx) => {
          allMaterials.push({
            unit_id: unitId, stage,
            material_type: m.material_type,
            title: m.title || MATERIAL_TYPE_CONFIG[m.material_type].label,
            description: m.description,
            file_url: m.file_url, file_name: m.file_name,
            external_url: m.external_url,
            sort_order: idx, is_published: m.is_published,
          });
        });
      });
      if (allMaterials.length > 0) {
        const { error: insErr } = await supabase.from('unit_stage_materials').insert(allMaterials);
        if (insErr) throw insErr;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await loadMaterials();
    } catch (e) {
      console.error('Error saving materials:', e);
      setSaveError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally { setSaving(false); }
  };

  const totalMaterials = STAGES.reduce((acc, s) => acc + materialsByStage[s.id].length, 0);

  if (loading) return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
        <p className="text-muted-foreground">Cargando materiales de la unidad...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* ── Top bar ── */}
      <div className="border-b border-border bg-card shrink-0 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">✏️ {unitTitle}</h1>
          <p className="text-xs text-muted-foreground">
            Editor de contenido · {totalMaterials} materiales · El quiz se guarda automáticamente al generarlo
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded-lg px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> ¡Guardado!
            </div>
          )}
          {saveError && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-1.5 max-w-xs truncate">
              ⚠️ {saveError}
            </div>
          )}
          <Button
            onClick={save}
            disabled={saving}
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4"
          >
            {saving
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
              : <><CheckCircle2 className="h-3.5 w-3.5" /> Guardar materiales</>
            }
          </Button>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Stages (one open at a time) ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          <p className="text-xs text-muted-foreground text-center pb-1">Haz clic en cada Part para expandirla — solo una abierta a la vez</p>
          {STAGES.map((stage) => (
            <StagePanel
              key={stage.id}
              stage={stage}
              unitId={unitId}
              materials={materialsByStage[stage.id]}
              onMaterialsChange={updated => handleStageChange(stage.id, updated)}
              isExpanded={expandedStage === stage.id}
              onToggle={() => setExpandedStage(prev => prev === stage.id ? null : stage.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}