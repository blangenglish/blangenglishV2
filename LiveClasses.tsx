import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Video, Mic, Star } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { LIVE_CLASSES } from '@/data/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { AuthModal } from '@/lib/index';

const TOPICS_FILTER = ['Todas', 'Speaking', 'Gramática', 'Vocabulario', 'Negocios', 'Pronunciación', 'Writing'];

interface LiveClassesProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

export default function LiveClasses({ isLoggedIn = false, onOpenAuth, onLogout, userName }: LiveClassesProps) {
  const [selectedTopic, setSelectedTopic] = useState('Todas');
  const [joined, setJoined] = useState<string[]>([]);

  const filtered = LIVE_CLASSES.filter(
    (c) => selectedTopic === 'Todas' || c.topic === selectedTopic
  );

  const levelColors: Record<string, string> = {
    'Básico': 'bg-green-100 text-green-700',
    'Intermedio': 'bg-blue-100 text-blue-700',
    'Avanzado': 'bg-purple-100 text-purple-700',
    'Todos los niveles': 'bg-amber-100 text-amber-700',
  };

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🎥</span>
            <h1 className="text-3xl md:text-4xl font-bold">Clases en Vivo</h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Practica con profesores nativos en tiempo real. ¡Aprende hablando!
          </p>

          {/* Live badge */}
          <div className="ml-14 mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              En vivo ahora
            </div>
            <span className="text-xs text-muted-foreground">1 clase activa</span>
          </div>
        </motion.div>

        {/* Topic filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 flex-wrap mb-8"
        >
          {TOPICS_FILTER.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`text-sm px-4 py-2 rounded-full font-medium transition-all ${
                selectedTopic === topic
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {topic}
            </button>
          ))}
        </motion.div>

        {/* Classes grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((cls, i) => {
            const isJoined = joined.includes(cls.id);
            const isAlmostFull = cls.spotsLeft <= 4;

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className={`border-border/50 hover:shadow-xl transition-all duration-300 ${isJoined ? 'border-primary/40 bg-primary/5' : ''}`}>
                  <CardContent className="p-6">
                    {/* Class header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl mt-0.5">{cls.emoji}</span>
                        <div>
                          <h3 className="font-bold text-base leading-tight mb-1">{cls.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[cls.level] || 'bg-muted text-muted-foreground'}`}>
                              {cls.level}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              {cls.topic}
                            </span>
                          </div>
                        </div>
                      </div>
                      {cls.date === 'Hoy' && (
                        <Badge className="bg-red-100 text-red-600 border-0 text-xs flex-shrink-0">
                          🔴 Hoy
                        </Badge>
                      )}
                    </div>

                    {/* Teacher */}
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={cls.teacherAvatar} alt={cls.teacher} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{cls.teacher.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{cls.teacher}</p>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                          <span className="text-xs text-muted-foreground ml-1">Nativo</span>
                        </div>
                      </div>
                    </div>

                    {/* Class info */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{cls.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{cls.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5" />
                        <span>{cls.duration}</span>
                      </div>
                    </div>

                    {/* Spots */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span>{cls.spotsLeft} lugares disponibles</span>
                        </div>
                        {isAlmostFull && (
                          <span className="text-red-500 font-semibold">¡Casi lleno!</span>
                        )}
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isAlmostFull ? 'bg-red-400' : 'bg-primary'}`}
                          style={{ width: `${((cls.spots - cls.spotsLeft) / cls.spots) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    {isJoined ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                          <Video className="w-4 h-4" />
                          ¡Apuntado! Nos vemos en clase 🎉
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setJoined(joined.filter((id) => id !== cls.id))}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full rounded-xl"
                        onClick={() => {
                          if (!isLoggedIn) {
                            onOpenAuth?.('register');
                          } else {
                            setJoined([...joined, cls.id]);
                          }
                        }}
                      >
                        {cls.date === 'Hoy' ? '🔴 Entrar a la clase' : '📅 Reservar mi lugar'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 bg-gradient-to-br from-primary/10 to-purple-100/50 rounded-3xl p-8 text-center border border-primary/20"
          >
            <p className="text-3xl mb-3">🎥</p>
            <h3 className="text-xl font-bold mb-2">¡Accede a todas las clases en vivo!</h3>
            <p className="text-muted-foreground mb-5 text-sm">Regístrate y practica con profesores nativos en tiempo real</p>
            <Button className="rounded-full bg-primary text-primary-foreground px-8" onClick={() => onOpenAuth?.('register')}>
              Reservar mi lugar gratis 🚀
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
