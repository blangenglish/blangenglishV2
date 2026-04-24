import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { DBUnit } from '@/lib/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { X } from 'lucide-react'

interface UnitFormProps {
  courseId: string
  unit?: DBUnit | null
  onSave: () => void
  onClose: () => void
}

// Helper: llama admin-content-write con service_role (bypasa RLS)
async function adminWrite(action: string, table: string, data: Record<string, unknown>, id?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('No hay sesión activa');

  const { data: result, error } = await supabase.functions.invoke('admin-content-write', {
    body: { action, table, data, id },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  if (result?.error) {
    const e = result.error;
    const msg = typeof e === 'string' ? e : (e.message ?? e.details ?? JSON.stringify(e));
    throw new Error(msg);
  }
  return result?.data;
}

export function UnitForm({ courseId, unit, onSave, onClose }: UnitFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (unit) {
      setTitle(unit.title)
      setDescription(unit.description)
      setSortOrder(unit.sort_order)
      setIsPublished(unit.is_published)
    }
  }, [unit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const unitData: Record<string, unknown> = {
        course_id: courseId,
        title,
        description,
        sort_order: sortOrder,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      }

      if (unit) {
        await adminWrite('update', 'units', unitData, unit.id)
      } else {
        unitData.created_at = new Date().toISOString()
        await adminWrite('insert', 'units', unitData)
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl bg-card p-8 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-semibold">
          {unit ? 'Editar Unidad' : 'Nueva Unidad'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Introducción al Presente Simple"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contenido de esta unidad..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Orden</Label>
            <Input
              id="sort_order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              min={0}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_published" className="text-base">Publicado</Label>
              <p className="text-sm text-muted-foreground">La unidad será visible para los estudiantes</p>
            </div>
            <Switch
              id="is_published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive space-y-1">
              <p className="font-semibold">Error al guardar:</p>
              <p className="font-mono text-xs break-all">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Guardando...' : unit ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
