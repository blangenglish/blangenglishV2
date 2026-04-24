import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CourseForm } from '@/components/admin/CourseForm';
import { UnitForm } from '@/components/admin/UnitForm';
import { UnitStagesEditor } from '@/components/admin/UnitStagesEditor';
import { supabase } from '@/integrations/supabase/client';
import { adminUpdate, adminDelete } from '@/lib/adminWrite';
import type { DBCourse, DBUnit } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  FileEdit,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AdminCourses() {
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<DBCourse | null>(null);
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<DBUnit | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'course' | 'unit';
    id: string;
  } | null>(null);
  const [contentEditorOpen, setContentEditorOpen] = useState(false);
  const [editingUnitContent, setEditingUnitContent] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: courses, isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('[AdminCourses] Error cargando cursos:', error);
        throw error;
      }
      return (data ?? []) as DBCourse[];
    },
    retry: 2,
  });

  const { data: units, refetch: refetchUnits } = useQuery({
    queryKey: ['admin-units', expandedCourseId],
    queryFn: async () => {
      if (!expandedCourseId) return [];
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', expandedCourseId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as DBUnit[];
    },
    enabled: !!expandedCourseId,
  });

  const handleAddCourse = () => {
    setEditingCourse(null);
    setCourseFormOpen(true);
  };

  const handleEditCourse = (course: DBCourse) => {
    setEditingCourse(course);
    setCourseFormOpen(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    setDeleteTarget({ type: 'course', id: courseId });
    setDeleteDialogOpen(true);
  };

  const handleToggleCoursePublished = async (course: DBCourse) => {
    try {
      await adminUpdate('courses', { is_published: !course.is_published, updated_at: new Date().toISOString() }, course.id);
      toast.success('Estado de publicación actualizado');
      refetchCourses();
    } catch {
      toast.error('Error al actualizar el estado de publicación');
    }
  };

  const handleAddUnit = (courseId: string) => {
    setSelectedCourseId(courseId);
    setEditingUnit(null);
    setUnitFormOpen(true);
  };

  const handleEditUnit = (unit: DBUnit) => {
    setSelectedCourseId(unit.course_id);
    setEditingUnit(unit);
    setUnitFormOpen(true);
  };

  const handleDeleteUnit = (unitId: string) => {
    setDeleteTarget({ type: 'unit', id: unitId });
    setDeleteDialogOpen(true);
  };

  const handleToggleUnitPublished = async (unit: DBUnit) => {
    try {
      await adminUpdate('units', { is_published: !unit.is_published, updated_at: new Date().toISOString() }, unit.id);
      toast.success('Estado de publicación actualizado');
      refetchUnits();
    } catch {
      toast.error('Error al actualizar el estado de publicación');
    }
  };

  const handleEditContent = (unit: DBUnit) => {
    setEditingUnitContent({ id: unit.id, title: unit.title });
    setContentEditorOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'course') {
        await adminDelete('courses', deleteTarget.id);
        toast.success('Curso eliminado');
        refetchCourses();
      } else if (deleteTarget.type === 'unit') {
        await adminDelete('units', deleteTarget.id);
        toast.success('Unidad eliminada');
        refetchUnits();
      }
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleCourseExpand = (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
    } else {
      setExpandedCourseId(courseId);
    }
  };

  if (coursesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-muted-foreground">Cargando cursos...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (coursesError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="text-4xl">⚠️</div>
            <p className="font-semibold text-destructive">Error al cargar cursos</p>
            <p className="text-sm text-muted-foreground">{(coursesError as Error).message}</p>
            <button onClick={() => refetchCourses()} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
              Reintentar
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Cursos</h1>
            <p className="text-muted-foreground mt-1">
              Administra cursos, unidades y contenido de aprendizaje
            </p>
          </div>
          <Button onClick={handleAddCourse} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Curso
          </Button>
        </div>

        <div className="space-y-4">
          {courses && courses.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No hay cursos creados aún
              </p>
              <Button onClick={handleAddCourse}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer curso
              </Button>
            </Card>
          )}

          {courses?.map((course) => (
            <Card key={course.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 text-muted-foreground cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{course.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold">{course.title}</h3>
                          <Badge variant="secondary">{course.level}</Badge>
                          {course.is_published && (
                            <Badge variant="default">Publicado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{course.total_units} unidades</span>
                          <span>Orden: {course.sort_order}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Publicado
                        </span>
                        <Switch
                          checked={course.is_published}
                          onCheckedChange={() => handleToggleCoursePublished(course)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCourseExpand(course.id)}
                      >
                        {expandedCourseId === course.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {expandedCourseId === course.id && (
                    <div className="pl-12 space-y-3 border-l-2 border-primary/20">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Unidades</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddUnit(course.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar Unidad
                        </Button>
                      </div>

                      {units && units.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4">
                          No hay unidades en este curso
                        </p>
                      )}

                      {units?.map((unit) => (
                        <Card key={unit.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium">{unit.title}</h5>
                                {unit.is_published && (
                                  <Badge variant="secondary" className="text-xs">
                                    Publicado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {unit.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Orden: {unit.sort_order}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-2 mr-2">
                                <span className="text-xs text-muted-foreground">
                                  Publicado
                                </span>
                                <Switch
                                  checked={unit.is_published}
                                  onCheckedChange={() => handleToggleUnitPublished(unit)}
                                />
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleEditContent(unit)}
                                className="mr-1"
                              >
                                <FileEdit className="w-3 h-3 mr-1" />
                                Editar Contenido
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditUnit(unit)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUnit(unit.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {courseFormOpen && (
        <CourseForm
          course={editingCourse}
          onSave={() => {
            setCourseFormOpen(false);
            setEditingCourse(null);
            refetchCourses();
          }}
          onClose={() => {
            setCourseFormOpen(false);
            setEditingCourse(null);
          }}
        />
      )}

      {unitFormOpen && selectedCourseId && (
        <UnitForm
          courseId={selectedCourseId}
          unit={editingUnit}
          onSave={() => {
            setUnitFormOpen(false);
            setEditingUnit(null);
            setSelectedCourseId(null);
            refetchUnits();
          }}
          onClose={() => {
            setUnitFormOpen(false);
            setEditingUnit(null);
            setSelectedCourseId(null);
          }}
        />
      )}

      {contentEditorOpen && editingUnitContent && (
        <UnitStagesEditor
          unitId={editingUnitContent.id}
          unitTitle={editingUnitContent.title}
          onClose={() => {
            setContentEditorOpen(false);
            setEditingUnitContent(null);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el{' '}
              {deleteTarget?.type === 'course' && 'curso y todas sus unidades'}
              {deleteTarget?.type === 'unit' && 'unidad y todo su contenido'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}