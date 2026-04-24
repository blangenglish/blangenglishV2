import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, TrendingUp, BookOpen, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ProgressRing } from '@/components/Cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import type { AuthModal } from '@/lib/index';

interface ProgressPageProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
  userId?: string;
}

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseEmoji: string;
  courseLevel: string;
  totalUnits: number;
  completedUnits: number;
}

interface StudentProfile {
  english_level?: string;
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const days = [...new Set(dates.map(d => d.slice(0, 10)))].sort().reverse();
  if (!days.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

const LEVEL_ORDER = [
  { keys: ['a1', 'beginner', 'básico', 'basico', 'inglés básico', 'ingles basico'], label: 'Beginner / A1' },
  { keys: ['a2', 'elementary', 'elemental'], label: 'Elementary / A2' },
  { keys: ['b1', 'pre-intermediate', 'pre intermediate', 'pre-intermedio'], label: 'Pre-Intermediate / B1' },
  { keys: ['b2', 'intermediate', 'intermedio'], label: 'Intermediate / B2' },
  { keys: ['c1', 'upper-intermediate', 'upper intermediate', 'upper intermedio'], label: 'Upper-Intermediate / C1' },
  { keys: ['c2', 'advanced', 'avanzado'], label: 'Advanced / C2' },
];

function getLevelIdx(rawLevel?: string): number {
  if (!rawLevel) return 0;
  const norm = rawLevel.toLowerCase().trim();
  const idx = LEVEL_ORDER.findIndex(l => l.keys.some(k => norm.includes(k)));
  return idx >= 0 ? idx : 0;
}

export default function ProgressPage({
  isLoggedIn = false, onOpenAuth, onLogout, userName, userId,
}: ProgressPageProps) {
  const [loading, setLoading] = useState(true);
  const [courseProgresses, setCourseProgresses] = useState<CourseProgress[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const loadProgress = useCallback(async () => {
    if (!userId) {
      setDebugLines(['Sin userId — no hay sesion activa']);
      setLoading(false);
      return;
    }
    setLoading(true);
    const log: string[] = ['userId: ' + userId];

    try {
      // 1. Perfil
      const { data: prof, error: profErr } = await supabase
        .from('student_profiles')
        .select('english_level')
        .eq('id', userId)
        .single();
      setProfile(prof);
      log.push('perfil english_level: ' + (prof?.english_level || 'null') + (profErr ? ' ERR:' + profErr.message : ' ok'));

      // 2. Cursos publicados
      const { data: courses, error: cErr } = await supabase
        .from('courses')
        .select('id, title, emoji, level')
        .eq('is_published', true)
        .order('sort_order');
      log.push('cursos: ' + (courses?.length ?? 0) + (cErr ? ' ERR:' + cErr.message : ' ok'));

      if (!courses?.length) {
        setDebugLines(log);
        setCourseProgresses([]);
        setLoading(false);
        return;
      }

      // 3. Unidades publicadas
      const courseIds = courses.map(c => c.id);
      const { data: units, error: uErr } = await supabase
        .from('units')
        .select('id, course_id')
        .in('course_id', courseIds)
        .eq('is_published', true);
      const allUnits = units || [];
      log.push('unidades: ' + allUnits.length + (uErr ? ' ERR:' + uErr.message : ' ok'));

      // 4. Todo el progreso del estudiante (sin filtrar por unit_id)
      const { data: progAll, error: pErr } = await supabase
        .from('unit_progress')
        .select('unit_id, stage, completed, completed_at')
        .eq('student_id', userId);

      const allProg = progAll || [];
      const completedRows = allProg.filter(p => p.completed === true);
      log.push('progress rows total: ' + allProg.length + ', completed: ' + completedRows.length + (pErr ? ' ERR:' + pErr.message : ' ok'));
      if (completedRows.length > 0) {
        log.push('primer completado: unit_id=' + completedRows[0].unit_id + ' stage=' + completedRows[0].stage);
      }

      // Racha
      const allDates = completedRows
        .map((p: { completed_at: string | null }) => p.completed_at)
        .filter(Boolean) as string[];
      setStreak(calcStreak(allDates));

      // Unidades con al menos 1 parte completada
      const completedUnitIds = new Set(
        completedRows.map((p: { unit_id: string }) => p.unit_id)
      );
      log.push('unit_ids con progreso: ' + completedUnitIds.size);

      const progByCourse: CourseProgress[] = courses.map(course => {
        const courseUnits = allUnits.filter(u => u.course_id === course.id);
        const completedInCourse = courseUnits.filter(u => completedUnitIds.has(u.id)).length;
        return {
          courseId: course.id,
          courseTitle: course.title,
          courseEmoji: course.emoji || '📚',
          courseLevel: course.level || '',
          totalUnits: courseUnits.length,
          completedUnits: completedInCourse,
        };
      }).filter(c => c.totalUnits > 0);

      setCourseProgresses(progByCourse);
      const tc = progByCourse.reduce((a, c) => a + c.completedUnits, 0);
      const tu = progByCourse.reduce((a, c) => a + c.totalUnits, 0);
      setTotalCompleted(tc);
      setTotalUnits(tu);
      log.push('resultado final: ' + tc + ' completadas de ' + tu);
      setDebugLines(log);

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.push('CATCH ERROR: ' + msg);
      setDebugLines(log);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const overallPct = totalUnits > 0 ? Math.round((totalCompleted / totalUnits) * 100) : 0;
  const rawLevel = profile?.english_level;
  const levelIdx = getLevelIdx(rawLevel);
  const currentLevelLabel = LEVEL_ORDER[levelIdx]?.label ?? (rawLevel || 'Beginner');
  const nextLevelLabel = levelIdx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[levelIdx + 1].label : null;
  const levelPct = Math.round(((levelIdx + 1) / LEVEL_ORDER.length) * 100);

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-4xl">📊</span>
            <h1 className="text-3xl font-bold">Mi Progreso</h1>
          </div>
          <p className="text-muted-foreground ml-14 text-sm">
            {isLoggedIn && userName
              ? '¡Hola, ' + userName + '! Aquí está tu avance real.'
              : 'Inicia sesión para ver tu progreso.'}
          </p>
        </motion.div>

        {/* Sin sesión */}
        {!isLoggedIn && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-purple-100/50 rounded-3xl p-10 text-center border border-primary/20">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Tu progreso te espera</h3>
            <p className="text-muted-foreground mb-5 text-sm">Regístrate para llevar un seguimiento real</p>
            <Button className="rounded-full px-8" onClick={() => onOpenAuth?.('register')}>
              Empezar 🚀
            </Button>
          </motion.div>
        )}

        {/* Cargando */}
        {isLoggedIn && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Contenido */}
        {isLoggedIn && !loading && (
          <div className="space-y-6">

            {/* Stats */}
            <motion.div className="grid grid-cols-2 gap-4"
              initial="hidden" animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {[
                {
                  icon: <Flame className="w-7 h-7 text-orange-500" />,
                  value: streak,
                  unit: streak === 1 ? 'día' : 'días',
                  label: 'Racha seguida',
                  bg: 'bg-orange-50 border-orange-200',
                  sub: streak > 0 ? '🔥 ¡Sigue así!' : '💤 Sin racha aún',
                  subColor: streak > 0 ? 'text-orange-600' : 'text-muted-foreground',
                },
                {
                  icon: <Trophy className="w-7 h-7 text-green-600" />,
                  value: totalCompleted,
                  unit: 'de ' + totalUnits,
                  label: 'Unidades completadas',
                  bg: 'bg-green-50 border-green-200',
                  sub: totalCompleted === totalUnits && totalUnits > 0 ? '🎉 ¡Todo completado!' : overallPct + '% del curso',
                  subColor: totalCompleted > 0 ? 'text-green-600' : 'text-muted-foreground',
                },
              ].map((stat, i) => (
                <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <Card className={'border h-full ' + stat.bg}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{stat.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-3xl font-extrabold leading-none">
                            {stat.value}
                            <span className="text-sm font-medium text-muted-foreground ml-1">{stat.unit}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                          <p className={'text-xs font-semibold mt-1.5 ' + stat.subColor}>{stat.sub}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Progreso general + nivel */}
            <div className="grid md:grid-cols-2 gap-5">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-border/50 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Progreso General
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-5">
                      <ProgressRing value={overallPct} size={100} label="" />
                      <div>
                        <p className="text-4xl font-extrabold">{overallPct}%</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {totalCompleted} unidad{totalCompleted !== 1 ? 'es' : ''} completada{totalCompleted !== 1 ? 's' : ''}
                        </p>
                        {totalCompleted === 0 && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            ¡Completa tu primera unidad!
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-border/50 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" /> Mi Nivel de Inglés
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold leading-tight">{currentLevelLabel}</p>
                        {nextLevelLabel
                          ? <p className="text-xs text-muted-foreground mt-0.5">Siguiente: <span className="font-semibold">{nextLevelLabel}</span></p>
                          : <p className="text-xs text-green-600 font-semibold mt-0.5">🏆 ¡Nivel máximo!</p>
                        }
                      </div>
                      <Badge variant="outline" className="text-xs font-bold shrink-0">
                        Nivel {levelIdx + 1}/6
                      </Badge>
                    </div>
                    <div>
                      <Progress value={levelPct} className="h-2.5 rounded-full" />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>Beginner</span><span>Advanced</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap pt-1">
                      {LEVEL_ORDER.map((lvl, i) => (
                        <span key={i} className={
                          'text-[10px] px-2 py-0.5 rounded-full font-medium border ' + (
                            i < levelIdx ? 'bg-green-100 border-green-200 text-green-700' :
                            i === levelIdx ? 'bg-primary/10 border-primary/40 text-primary font-bold' :
                            'bg-muted/30 border-border/30 text-muted-foreground opacity-60'
                          )
                        }>
                          {i < levelIdx ? '✓ ' : i === levelIdx ? '▶ ' : ''}{lvl.label.split('/')[0].trim()}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Progreso por curso */}
            {courseProgresses.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" /> Progreso por Curso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {courseProgresses.map(cp => {
                      const pct = cp.totalUnits > 0 ? Math.round((cp.completedUnits / cp.totalUnits) * 100) : 0;
                      const done = cp.completedUnits === cp.totalUnits && cp.totalUnits > 0;
                      return (
                        <div key={cp.courseId}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl shrink-0">{cp.courseEmoji}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{cp.courseTitle}</p>
                                <p className="text-[11px] text-muted-foreground">{cp.courseLevel}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <span className="text-xs text-muted-foreground font-medium">
                                {cp.completedUnits}/{cp.totalUnits}
                              </span>
                              {done
                                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                : <span className="text-xs font-bold text-primary">{pct}%</span>
                              }
                            </div>
                          </div>
                          <Progress
                            value={pct}
                            className={'h-2 rounded-full ' + (done ? '[&>div]:bg-green-500' : '')}
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Sin cursos */}
            {courseProgresses.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-center py-16 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold text-lg">Aún no has iniciado ningún curso</p>
                <p className="text-sm mt-1">¡Ve al dashboard y empieza tu primera unidad!</p>
              </motion.div>
            )}

            {/* Panel debug temporal */}
            {debugLines.length > 0 && (
              <div className="p-4 bg-gray-900 text-green-400 rounded-xl text-xs font-mono border border-gray-700">
                <p className="text-yellow-400 font-bold mb-2">🔍 Debug (temporal)</p>
                {debugLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </Layout>
  );
}
