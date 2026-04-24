import { motion } from 'framer-motion';
import { Check, Star, Lock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { Feature, PricingPlan, Testimonial, Lesson } from '@/lib/index';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ---- Feature Card ----
interface FeatureCardProps {
  feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.4 }}>
      <Card className={`h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-gradient-to-br ${feature.color} backdrop-blur-sm`}>
        <CardHeader>
          <div className="w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center mb-4 text-3xl shadow-sm">
            {feature.icon}
          </div>
          <CardTitle className="text-lg">{feature.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- Pricing Card ----
interface PricingCardProps {
  plan: PricingPlan;
  onSelect?: () => void;
}

export function PricingCard({ plan, onSelect }: PricingCardProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="h-full"
      whileHover={{ y: -4 }}
    >
      <Card className={`h-full flex flex-col relative overflow-hidden ${plan.popular ? 'border-primary ring-2 ring-primary shadow-2xl shadow-primary/20' : 'border-border/50'}`}>
        {plan.popular && (
          <>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-400 to-pink-400" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 pt-2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-full shadow-lg">
                ⭐ Más Popular
              </Badge>
            </div>
          </>
        )}
        <CardHeader className="text-center pb-6 pt-8">
          <div className="text-4xl mb-2">{plan.emoji}</div>
          <CardTitle className="text-xl mb-1">{plan.name}</CardTitle>
          {plan.badge && (
            <div className="mt-2">
              <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            </div>
          )}
          <div className="mt-3">
            {plan.price === 0 ? (
              <span className="text-4xl font-bold text-primary">GRATIS</span>
            ) : (
              <>
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground text-sm ml-1">/{plan.billingPeriod}</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 px-6">
          <ul className="space-y-3">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="p-6 pt-4">
          <Button
            className={`w-full rounded-xl py-6 font-semibold text-sm ${plan.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`}
            variant={plan.popular ? 'default' : 'outline'}
            onClick={onSelect}
          >
            {plan.cta} →
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ---- Testimonial Card ----
interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.4 }}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14 border-2 border-primary/20">
              <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{testimonial.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm">{testimonial.name}</p>
                <span>{testimonial.flag}</span>
              </div>
              <p className="text-xs text-muted-foreground">{testimonial.country}</p>
              <div className="flex gap-0.5 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed italic">"{testimonial.quote}"</p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            ✅ {testimonial.level}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- Lesson Card ----
interface LessonCardProps {
  lesson: Lesson;
  onStart?: (id: string) => void;
}

export function LessonCard({ lesson, onStart }: LessonCardProps) {
  const levelColors: Record<string, string> = {
    'Básico': 'bg-green-100 text-green-700',
    'Intermedio': 'bg-blue-100 text-blue-700',
    'Avanzado': 'bg-purple-100 text-purple-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={lesson.locked ? {} : { scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-border/50 transition-all ${lesson.locked ? 'opacity-50' : 'hover:shadow-md cursor-pointer'} ${lesson.completed ? 'bg-primary/5 border-primary/20' : ''}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${lesson.completed ? 'bg-primary/10' : 'bg-muted'}`}>
            {lesson.locked ? '🔒' : lesson.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className={`font-semibold text-sm ${lesson.locked ? 'text-muted-foreground' : ''}`}>{lesson.title}</p>
              {lesson.completed && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Completado</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[lesson.level] || 'bg-muted text-muted-foreground'}`}>
                {lesson.level}
              </span>
              <span className="text-xs text-muted-foreground">{lesson.topic}</span>
              <span className="text-xs text-muted-foreground">⏱ {lesson.duration}</span>
            </div>
          </div>
          {!lesson.locked && !lesson.completed && (
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground flex-shrink-0" onClick={() => onStart?.(lesson.id)}>
              Empezar
            </Button>
          )}
          {lesson.locked && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          {lesson.completed && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- Progress Ring Component ----
interface ProgressRingProps {
  value: number;
  size?: number;
  label: string;
  sublabel?: string;
  color?: string;
}

export function ProgressRing({ value, size = 100, label, sublabel, color = 'text-primary' }: ProgressRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-700`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{value}%</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-center">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground text-center">{sublabel}</p>}
    </div>
  );
}
