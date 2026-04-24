import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus, GripVertical, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface QuizQuestion {
  id?: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer'
  options?: string[]
  correct_answer: string
  explanation?: string
  sort_order: number
}

interface Quiz {
  id?: string
  unit_id: string
  title: string
  description?: string
  pass_score: number
  questions: QuizQuestion[]
}

interface QuizEditorProps {
  unitId: string
  onClose: () => void
}

export function QuizEditor({ unitId, onClose }: QuizEditorProps) {
  const [quiz, setQuiz] = useState<Quiz>({
    unit_id: unitId,
    title: '',
    description: '',
    pass_score: 70,
    questions: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadQuiz()
  }, [unitId])

  const loadQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('unit_id', unitId)
        .single()

      if (quizError && quizError.code !== 'PGRST116') {
        throw quizError
      }

      if (quizData) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('sort_order')

        if (questionsError) throw questionsError

        setQuiz({
          id: quizData.id,
          unit_id: quizData.unit_id,
          title: quizData.title,
          description: quizData.description || '',
          pass_score: quizData.pass_score,
          questions: questionsData.map(q => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options || [],
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            sort_order: q.sort_order
          }))
        })
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
      toast.error('Error al cargar el examen')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!quiz.title.trim()) {
      toast.error('El título del examen es requerido')
      return
    }

    if (quiz.questions.length === 0) {
      toast.error('Agrega al menos una pregunta')
      return
    }

    setSaving(true)
    try {
      let quizId = quiz.id

      if (quizId) {
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({
            title: quiz.title,
            description: quiz.description,
            pass_score: quiz.pass_score,
            updated_at: new Date().toISOString()
          })
          .eq('id', quizId)

        if (updateError) throw updateError
      } else {
        const { data: newQuiz, error: insertError } = await supabase
          .from('quizzes')
          .insert({
            unit_id: unitId,
            title: quiz.title,
            description: quiz.description,
            pass_score: quiz.pass_score
          })
          .select()
          .single()

        if (insertError) throw insertError
        quizId = newQuiz.id
      }

      const { error: deleteError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId)

      if (deleteError) throw deleteError

      const questionsToInsert = quiz.questions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options : null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        sort_order: index
      }))

      const { error: insertQuestionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert)

      if (insertQuestionsError) throw insertQuestionsError

      toast.success('Examen guardado exitosamente')
      onClose()
    } catch (error) {
      console.error('Error saving quiz:', error)
      toast.error('Error al guardar el examen')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: '',
          question_type: 'multiple_choice',
          options: ['', '', '', ''],
          correct_answer: '',
          explanation: '',
          sort_order: prev.questions.length
        }
      ]
    }))
  }

  const removeQuestion = (index: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= quiz.questions.length) return

    const newQuestions = [...quiz.questions]
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[newIndex]
    newQuestions[newIndex] = temp

    setQuiz(prev => ({ ...prev, questions: newQuestions }))
  }

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== index) return q
        if (field === 'question_type' && value !== 'multiple_choice') {
          return { ...q, [field]: value, options: undefined }
        }
        if (field === 'question_type' && value === 'multiple_choice' && !q.options) {
          return { ...q, [field]: value, options: ['', '', '', ''] }
        }
        return { ...q, [field]: value }
      })
    }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex || !q.options) return q
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      })
    }))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Cargando examen...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <Card className="w-full max-w-4xl my-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <CardTitle className="text-2xl font-bold">Editor de Examen</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz-title">Título del Examen</Label>
                <Input
                  id="quiz-title"
                  value={quiz.title}
                  onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Examen de Gramática - Presente Simple"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="quiz-description">Descripción (opcional)</Label>
                <Textarea
                  id="quiz-description"
                  value={quiz.description}
                  onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del examen..."
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="pass-score">Puntaje Mínimo para Aprobar (%)</Label>
                <Input
                  id="pass-score"
                  type="number"
                  min="0"
                  max="100"
                  value={quiz.pass_score}
                  onChange={(e) => setQuiz(prev => ({ ...prev, pass_score: parseInt(e.target.value) || 0 }))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preguntas</h3>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Pregunta
                </Button>
              </div>

              <div className="space-y-4">
                {quiz.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="border-2">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 pt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveQuestion(qIndex, 'up')}
                            disabled={qIndex === 0}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveQuestion(qIndex, 'down')}
                            disabled={qIndex === quiz.questions.length - 1}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <Label>Pregunta {qIndex + 1}</Label>
                              <Textarea
                                value={question.question_text}
                                onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                placeholder="Escribe la pregunta..."
                                rows={2}
                                className="mt-1.5"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(qIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div>
                            <Label>Tipo de Pregunta</Label>
                            <Select
                              value={question.question_type}
                              onValueChange={(value) => updateQuestion(qIndex, 'question_type', value)}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">Opción Múltiple (4 opciones)</SelectItem>
                                <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                                <SelectItem value="fill_blank">Llenar el Espacio</SelectItem>
                                <SelectItem value="short_answer">Respuesta Corta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {question.question_type === 'multiple_choice' && question.options && (
                            <div className="space-y-2">
                              <Label>Opciones</Label>
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground w-6">{String.fromCharCode(65 + oIndex)}.</span>
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    placeholder={`Opción ${String.fromCharCode(65 + oIndex)}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <div>
                            <Label>Respuesta Correcta</Label>
                            {question.question_type === 'multiple_choice' && question.options ? (
                              <Select
                                value={question.correct_answer}
                                onValueChange={(value) => updateQuestion(qIndex, 'correct_answer', value)}
                              >
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue placeholder="Selecciona la opción correcta" />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options.map((option, oIndex) => (
                                    <SelectItem key={oIndex} value={option}>
                                      {String.fromCharCode(65 + oIndex)}. {option || '(vacío)'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : question.question_type === 'true_false' ? (
                              <Select
                                value={question.correct_answer}
                                onValueChange={(value) => updateQuestion(qIndex, 'correct_answer', value)}
                              >
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue placeholder="Selecciona Verdadero o Falso" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Verdadero</SelectItem>
                                  <SelectItem value="false">Falso</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={question.correct_answer}
                                onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                                placeholder="Escribe la respuesta correcta"
                                className="mt-1.5"
                              />
                            )}
                          </div>

                          <div>
                            <Label>Explicación (opcional)</Label>
                            <Textarea
                              value={question.explanation}
                              onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                              placeholder="Explica por qué esta es la respuesta correcta..."
                              rows={2}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {quiz.questions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No hay preguntas. Haz clic en "Agregar Pregunta" para comenzar.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Examen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}