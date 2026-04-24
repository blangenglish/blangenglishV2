import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, CheckCircle, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface LevelExamProps {
  open: boolean;
  userId: string;
  onResult: (level: string, accepted: boolean) => void;
  onClose: () => void;
}

interface ExamQuestion {
  id: number;
  level: string;
  question: string;
  options: string[];
  ans: number;
}

const EXAM_QUESTIONS: ExamQuestion[] = [
  // A1
  { id: 1,  level: 'A1', question: 'What is your name?',                                    options: ['My name is Ana.', 'I am fine.', 'I am 20 years old.', 'I live in Bogotá.'], ans: 0 },
  { id: 2,  level: 'A1', question: 'Choose the correct sentence:',                          options: ['She have a cat.', 'She has a cat.', 'She is have a cat.', 'She does has a cat.'], ans: 1 },
  { id: 3,  level: 'A1', question: '"Buenos días" in English is:',                          options: ['Good night', 'Good afternoon', 'Good morning', 'Good evening'], ans: 2 },
  // A2
  { id: 4,  level: 'A2', question: 'Yesterday I ___ to the supermarket.',                   options: ['go', 'goes', 'went', 'gone'], ans: 2 },
  { id: 5,  level: 'A2', question: 'Which sentence is correct?',                            options: ['I like play football.', 'I like playing football.', 'I like to playing football.', 'I likes playing football.'], ans: 1 },
  { id: 6,  level: 'A2', question: 'How ___ sugar do you need?',                            options: ['many', 'few', 'much', 'some'], ans: 2 },
  // B1
  { id: 7,  level: 'B1', question: 'If I ___ more time, I would study every day.',          options: ['had', 'have', 'will have', 'having'], ans: 0 },
  { id: 8,  level: 'B1', question: 'The project ___ by the team last week.',                options: ['was completed', 'completed', 'has completed', 'is completing'], ans: 0 },
  { id: 9,  level: 'B1', question: 'She asked me where ___ from.',                          options: ['am I', 'I am', 'was I', 'I were'], ans: 1 },
  // B2
  { id: 10, level: 'B2', question: 'Despite ___ hard, he didn\'t pass the exam.',           options: ['studying', 'studied', 'to study', 'study'], ans: 0 },
  { id: 11, level: 'B2', question: 'The new regulation ___ into effect next month.',         options: ['will come', 'comes', 'come', 'is come'], ans: 0 },
  { id: 12, level: 'B2', question: '"He kicked the bucket" means:',                         options: ['He bought a bucket.', 'He became angry.', 'He died.', 'He lost his money.'], ans: 2 },
  // C1
  { id: 13, level: 'C1', question: 'Had she known about the problem, she ___ earlier.',     options: ['would have left', 'would leave', 'will have left', 'left'], ans: 0 },
  { id: 14, level: 'C1', question: 'The report was ___ ambiguous to draw firm conclusions.',options: ['such', 'so', 'too', 'very'], ans: 2 },
  { id: 15, level: 'C1', question: 'The author\'s use of irony ___ her criticism of society.',options: ['underlines', 'underlies', 'undertakes', 'undercuts'], ans: 0 },
];

const LEVEL_LABELS: Record<string, string> = {
  A1: 'Principiante', A2: 'Elemental', B1: 'Intermedio', B2: 'Intermedio Avanzado', C1: 'Avanzado',
};
const LEVEL_EMOJIS: Record<string, string> = {
  A1: '🌱', A2: '📗', B1: '📘', B2: '📙', C1: '🏆',
};
const LEVEL_COLORS: Record<string, string> = {
  A1: 'from-green-400 to-emerald-500',
  A2: 'from-teal-400 to-cyan-500',
  B1: 'from-blue-400 to-indigo-500',
  B2: 'from-purple-400 to-violet-500',
  C1: 'from-amber-400 to-orange-500',
};

function calcLevel(answers: number[]): string {
  const perLevel: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
  EXAM_QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.ans) perLevel[q.level]++;
  });
  const levels = ['C1', 'B2', 'B1', 'A2', 'A1'];
  for (const lvl of levels) {
    if (perLevel[lvl] >= 2) return lvl;
  }
  return 'A1';
}

const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export function LevelExam({ open, userId, onResult, onClose }: LevelExamProps) {
  const [phase, setPhase] = useState<'intro' | 'exam' | 'result' | 'choose_other'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [resultLevel, setResultLevel] = useState('');
  const [chosenOtherLevel, setChosenOtherLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    setTimeout(() => {
      const newAnswers = [...answers, idx];
      if (currentQ + 1 < EXAM_QUESTIONS.length) {
        setAnswers(newAnswers);
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        const level = calcLevel(newAnswers);
        setResultLevel(level);
        setAnswers(newAnswers);
        setPhase('result');
      }
    }, 600);
  };

  const saveLevel = async (level: string, source: 'exam' | 'self_selected') => {
    setSaving(true);
    // Usar edge function con service_role: guarda nivel Y habilita módulos correspondientes
    const { error } = await supabase.functions.invoke('save-onboarding-2026', {
      body: { action: 'save_level', student_id: userId, level, source },
    });
    if (error) {
      console.error('LevelExam saveLevel edge error:', error);
      // Fallback directo — NO tocar account_enabled ni módulos
      await supabase.from('student_profiles').update({
        english_level: level,
        level_source: source,
        level_set_at: new Date().toISOString(),
        onboarding_step: 'completed',
      }).eq('id', userId);
    }
    setSaving(false);
    onResult(level, true);
  };

  const progress = ((currentQ) / EXAM_QUESTIONS.length) * 100;
  const question = EXAM_QUESTIONS[currentQ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
          <motion.div
            className="relative bg-background rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[92vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            <div className="h-1.5 bg-gradient-to-r from-primary via-purple-400 to-pink-400" />

            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            {/* ── INTRO ── */}
            {phase === 'intro' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold mb-2">Examen de Nivel 📝</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                  15 preguntas de inglés (A1–C1). Duración aproximada: <strong>5 minutos</strong>. Al final sabrás tu nivel y se habilitarán los cursos correspondientes.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6 max-w-xs mx-auto">
                  {['A1–A2', 'B1–B2', 'C1'].map((r, i) => (
                    <div key={i} className="bg-muted rounded-xl p-2 text-center text-xs font-bold">{r}</div>
                  ))}
                </div>
                <Button onClick={() => setPhase('exam')} className="w-full max-w-xs rounded-xl py-3 text-base font-semibold">
                  Comenzar examen 🚀
                </Button>
              </div>
            )}

            {/* ── EXAM ── */}
            {phase === 'exam' && (
              <div className="p-6">
                {/* Progress */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Pregunta {currentQ + 1} de {EXAM_QUESTIONS.length}</span>
                    <span className="font-bold text-primary">{question.level}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQ}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-lg font-bold mb-4 leading-snug">{question.question}</p>
                    <div className="space-y-2">
                      {question.options.map((opt, idx) => {
                        let cls = 'w-full text-left p-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ';
                        if (selected === null) {
                          cls += 'border-border hover:border-primary hover:bg-primary/5';
                        } else if (idx === question.ans) {
                          cls += 'border-green-500 bg-green-50 text-green-800';
                        } else if (idx === selected && selected !== question.ans) {
                          cls += 'border-red-400 bg-red-50 text-red-700';
                        } else {
                          cls += 'border-border opacity-60';
                        }
                        return (
                          <button key={idx} className={cls} onClick={() => selected === null && handleAnswer(idx)}
                            disabled={selected !== null}>
                            <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][idx]}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* ── RESULT ── */}
            {phase === 'result' && (
              <div className="p-8 text-center">
                <div className={`w-24 h-24 bg-gradient-to-br ${LEVEL_COLORS[resultLevel]} rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl`}>
                  <span className="text-4xl">{LEVEL_EMOJIS[resultLevel]}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">Resultado del Examen</span>
                </div>
                <h2 className="text-3xl font-extrabold mb-1">Nivel {resultLevel}</h2>
                <p className="text-muted-foreground text-lg font-medium mb-2">{LEVEL_LABELS[resultLevel]}</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Basado en tu desempeño, tu nivel de inglés es <strong>{resultLevel} — {LEVEL_LABELS[resultLevel]}</strong>.
                  ⚠️ <em>Una vez confirmes, este nivel no podrá cambiarse.</em>
                </p>

                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <Button
                    onClick={() => saveLevel(resultLevel, 'exam')}
                    disabled={saving}
                    className="w-full rounded-xl py-3 font-semibold"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Aceptar — Soy nivel {resultLevel}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPhase('choose_other')}
                    className="w-full rounded-xl py-3 font-semibold"
                  >
                    Soy otro nivel — Elegir manualmente
                  </Button>
                </div>
              </div>
            )}

            {/* ── CHOOSE OTHER ── */}
            {phase === 'choose_other' && (
              <div className="p-8">
                <h2 className="text-2xl font-extrabold mb-2 text-center">Elige tu nivel 🎯</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Selecciona el nivel que mejor describe tu inglés actual.
                  <br /><strong className="text-amber-600">⚠️ No podrás cambiarlo después.</strong>
                </p>
                <div className="space-y-3">
                  {ALL_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setChosenOtherLevel(lvl)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        chosenOtherLevel === lvl
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{LEVEL_EMOJIS[lvl]}</span>
                      <div>
                        <p className="font-bold">{lvl}</p>
                        <p className="text-xs text-muted-foreground">{LEVEL_LABELS[lvl]}</p>
                      </div>
                      {chosenOtherLevel === lvl && (
                        <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setPhase('result')}>
                    ← Volver
                  </Button>
                  <Button
                    className="flex-1 rounded-xl"
                    disabled={!chosenOtherLevel || saving}
                    onClick={() => chosenOtherLevel && saveLevel(chosenOtherLevel, 'self_selected')}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </span>
                    ) : 'Confirmar nivel'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
