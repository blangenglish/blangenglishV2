import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { LessonCard } from '@/components/Cards';
import { LESSONS } from '@/data/index';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AuthModal } from '@/lib/index';

const LEVELS = ['Todos', 'Básico', 'Intermedio', 'Avanzado'];
const TOPICS = ['Todos', 'Speaking', 'Gramática', 'Vocabulario', 'Writing'];

interface LessonsProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

export default function Lessons({ isLoggedIn = false, onOpenAuth, onLogout, userName }: LessonsProps) {
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Todos');
  const [selectedTopic, setSelectedTopic] = useState('Todos');

  const filtered = LESSONS.filter((l) => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchLevel = selectedLevel === 'Todos' || l.level === selectedLevel;
    const matchTopic = selectedTopic === 'Todos' || l.topic === selectedTopic;
    return matchSearch && matchLevel && matchTopic;
  });

  const completed = LESSONS.filter((l) => l.completed).length;

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📚</span>
            <h1 className="text-3xl md:text-4xl font-bold">Mis Lecciones</h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Aprende a tu ritmo. {completed} de {LESSONS.length} lecciones completadas.
          </p>

          {/* Progress bar */}
          <div className="ml-14 mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Tu progreso</span>
              <span className="font-semibold text-primary">{Math.round((completed / LESSONS.length) * 100)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completed / LESSONS.length) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Nivel:</span>
            </div>
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  selectedLevel === lvl
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Tema:</span>
            </div>
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  selectedTopic === topic
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lessons list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">No encontramos lecciones con esos filtros</p>
            </div>
          ) : (
            filtered.map((lesson, i) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <LessonCard lesson={lesson} />
              </motion.div>
            ))
          )}
        </div>

        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 bg-gradient-to-br from-primary/10 to-purple-100/50 rounded-3xl p-8 text-center border border-primary/20"
          >
            <p className="text-3xl mb-3">🔓</p>
            <h3 className="text-xl font-bold mb-2">¡Desbloquea todas las lecciones!</h3>
            <p className="text-muted-foreground mb-5 text-sm">Regístrate gratis y accede a más de 500 lecciones interactivas</p>
            <Button className="rounded-full bg-primary text-primary-foreground px-8" onClick={() => onOpenAuth?.('register')}>
              Empezar gratis 🚀
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
