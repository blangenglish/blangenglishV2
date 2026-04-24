import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, UserCheck, UserX, Target, AlertCircle } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PaymentHistoryRow {
  id: string
  student_id: string
  event_type: string
  amount_usd: number
  payment_method: string
  notes?: string
  created_at: string
  student_email?: string
  student_name?: string
}

interface RevenueData {
  totalUSD: number
  activeSubscriptions: number
  trialUsers: number
  conversionRate: number
  monthlyRevenue: Array<{ month: string; usd: number }>
  revenueByMethod: Array<{ name: string; value: number }>
  recentPayments: PaymentHistoryRow[]
}

const COLORS = ['oklch(0.55 0.25 285)', 'oklch(0.60 0.20 150)', 'oklch(0.65 0.18 45)', 'oklch(0.58 0.22 15)', 'oklch(0.62 0.16 220)']

export default function AdminRevenue() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalUSD: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    conversionRate: 0,
    monthlyRevenue: [],
    revenueByMethod: [],
    recentPayments: [],
  })

  useEffect(() => {
    loadRevenueData()
  }, [selectedMonth])

  const loadRevenueData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Usar edge function para obtener datos de estudiantes (service_role)
      const { data: { session } } = await supabase.auth.getSession()
      const { data: allStudentsData } = await supabase.functions.invoke('admin-update-student', {
        body: { action: 'list_all_students' },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })

      const students = allStudentsData?.students || []
      const activeCount = students.filter((s: { subscription?: { status: string; plan_slug?: string } }) =>
        s.subscription?.status === 'active' && s.subscription?.plan_slug !== 'free_admin'
      ).length
      const trialCount = students.filter((s: { subscription?: { status: string }; account_status?: string }) =>
        s.subscription?.status === 'trial' ||
        (s as { account_status?: string }).account_status === 'active_trial'
      ).length
      const totalUsers = students.length
      const conversion = totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0

      // Cargar payment_history
      let phQuery = supabase
        .from('payment_history')
        .select('*')
        .eq('event_type', 'payment_approved')
        .order('created_at', { ascending: false })
        .limit(200)

      if (selectedMonth !== 'all') {
        const start = new Date(selectedMonth + '-01T00:00:00Z').toISOString()
        const end = new Date(selectedMonth + '-01T00:00:00Z')
        end.setMonth(end.getMonth() + 1)
        phQuery = phQuery.gte('created_at', start).lt('created_at', end.toISOString())
      }

      const { data: payHistory, error: phError } = await phQuery
      if (phError) throw phError

      // Build student email/name lookup
      const emailMap: Record<string, { email: string; name: string }> = {}
      for (const s of students) {
        emailMap[s.id] = { email: s.email || '—', name: s.full_name || '—' }
      }

      const payments: PaymentHistoryRow[] = (payHistory || []).map((p: unknown) => {
        const row = p as PaymentHistoryRow
        return {
          ...row,
          student_email: emailMap[row.student_id]?.email || '—',
          student_name: emailMap[row.student_id]?.name || '—',
        }
      })

      // Compute totals
      const totalUSD = payments.reduce((a, p) => a + (p.amount_usd || 0), 0)

      // Monthly revenue (last 6 months)
      const monthlyData: Record<string, number> = {}
      for (const p of payments) {
        const d = new Date(p.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyData[key] = (monthlyData[key] || 0) + (p.amount_usd || 0)
      }
      const monthlyRevenue = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, usd]) => ({
          month: new Date(month + '-01').toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }),
          usd: Math.round(usd * 100) / 100,
        }))

      // Revenue by payment method
      const methodData: Record<string, number> = {}
      for (const p of payments) {
        const m = p.payment_method || 'otro'
        methodData[m] = (methodData[m] || 0) + (p.amount_usd || 0)
      }
      const revenueByMethod = Object.entries(methodData).map(([name, value]) => ({ name: name.toUpperCase(), value }))

      setRevenueData({
        totalUSD: Math.round(totalUSD * 100) / 100,
        activeSubscriptions: activeCount,
        trialUsers: trialCount,
        conversionRate: conversion,
        monthlyRevenue,
        revenueByMethod,
        recentPayments: payments.slice(0, 20),
      })
    } catch (err) {
      console.error('Error loading revenue data:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar ingresos')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ingresos</h1>
            <p className="text-muted-foreground mt-2">Análisis de ingresos y suscripciones activos</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              <SelectItem value="2026-01">Enero 2026</SelectItem>
              <SelectItem value="2026-02">Febrero 2026</SelectItem>
              <SelectItem value="2026-03">Marzo 2026</SelectItem>
              <SelectItem value="2026-04">Abril 2026</SelectItem>
              <SelectItem value="2026-05">Mayo 2026</SelectItem>
              <SelectItem value="2026-06">Junio 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales (USD)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData.totalUSD)}</div>
              <p className="text-xs text-muted-foreground mt-1">Pagos aprobados{selectedMonth !== 'all' ? ' este mes' : ''}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{revenueData.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground mt-1">Estudiantes con plan activo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Período de Prueba</CardTitle>
              <UserX className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{revenueData.trialUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Estudiantes en trial activo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{revenueData.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Registrados → Activos</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Ingresos Mensuales (USD)</CardTitle>
              <CardDescription>Últimos 6 meses — pagos aprobados</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.monthlyRevenue.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  Sin datos de ingresos aún
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 270)" />
                    <XAxis dataKey="month" stroke="oklch(0.48 0.01 270)" fontSize={12} />
                    <YAxis stroke="oklch(0.48 0.01 270)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.98 0 0)',
                        border: '1px solid oklch(0.88 0.01 270)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`$${value} USD`, 'Ingresos']}
                    />
                    <Bar dataKey="usd" fill="oklch(0.55 0.25 285)" name="USD" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingresos por Método de Pago</CardTitle>
              <CardDescription>Distribución total</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.revenueByMethod.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  Sin datos de métodos de pago aún
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueData.revenueByMethod}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} ($${entry.value})`}
                      outerRadius={90}
                      fill="oklch(0.55 0.25 285)"
                      dataKey="value"
                    >
                      {revenueData.revenueByMethod.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.98 0 0)',
                        border: '1px solid oklch(0.88 0.01 270)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`$${value} USD`]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent payments table */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos Recientes</CardTitle>
            <CardDescription>Últimos 20 pagos aprobados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Monto USD</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Cargando datos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : revenueData.recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay pagos registrados{selectedMonth !== 'all' ? ' en este período' : ''}
                    </TableCell>
                  </TableRow>
                ) : (
                  revenueData.recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{payment.student_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-700">{formatCurrency(payment.amount_usd || 0)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{(payment.payment_method || 'N/A').toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {payment.notes || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
