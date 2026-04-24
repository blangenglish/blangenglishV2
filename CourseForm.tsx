import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { DBCourse } from '@/lib/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { X } from 'lucide-react'

interface CourseFormProps {
  course?: DBCourse | null
  onSave: () => void
  onClose: () => void
}

export function CourseForm({ course, onSave, onClose }: CourseFormProps) {
  const [emoji, setEmoji] = useState('')
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('A1')
  const [levelLabel, setLevelLabel] = useState('')
  const [description, setDescription] = useState('')
  const [totalUnits, setTotalUnits] = useState(0)
  const [isPublished, setIsPublished] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (course) {
      setEmoji(course.emoji)
      setTitle(course.title)
      setLevel(course.level)
      setLevelLabel(course.level_label)
      setDescription(course.description)
      setTotalUnits(course.total_units)
      setIsPublished(course.is_published)
      setSortOrder(course.sort_order)
    }
  }, [course])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const courseData = {
        emoji,
        title,
        level,
        level_label: levelLabel,
        description,
        total_units: totalUnits,
        is_published: isPublished,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      }

      if (course) {
        const { error: updateError } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('courses')
          .insert([{ ...courseData, created_at: new Date().toISOString() }])

        if (insertError) throw insertError
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el curso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{course ? 'Editar Curso' : 'Crear Curso'}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="📚"
                  maxLength={2}
                  className="w-20 text-center text-2xl"
                  required
                />
                {emoji && <span className="text-4xl">{emoji}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as typeof level)}>
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inglés Básico"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="levelLabel">Etiqueta de Nivel</Label>
            <Input
              id="levelLabel"
              value={levelLabel}
              onChange={(e) => setLevelLabel(e.target.value)}
              placeholder="Principiante"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aprende los fundamentos del inglés..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total de Unidades</Label>
              <Input
                id="totalUnits"
                type="number"
                value={totalUnits}
                onChange={(e) => setTotalUnits(parseInt(e.target.value) || 0)}
                min={0}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Orden</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                min={0}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished" className="text-base">
                Publicado
              </Label>
              <p className="text-sm text-muted-foreground">
                El curso será visible para los estudiantes
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : course ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
