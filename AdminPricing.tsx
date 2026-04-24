import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { usePricingPlans } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import type { DBPricingPlan } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Save, Trash2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EditablePlan extends Omit<DBPricingPlan, 'features'> {
  features: string[];
}

export default function AdminPricing() {
  const { data: plans, loading, refetch } = usePricingPlans();
  const [editingPlans, setEditingPlans] = useState<Record<string, EditablePlan>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getEditablePlan = (plan: DBPricingPlan): EditablePlan => {
    if (editingPlans[plan.id]) {
      return editingPlans[plan.id];
    }
    return {
      ...plan,
      features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
    };
  };

  const updatePlanField = (planId: string, field: keyof EditablePlan, value: any) => {
    const plan = plans?.find((p) => p.id === planId);
    if (!plan) return;

    setEditingPlans((prev) => ({
      ...prev,
      [planId]: {
        ...getEditablePlan(plan),
        [field]: value,
      },
    }));
  };

  const addFeature = (planId: string) => {
    const plan = plans?.find((p) => p.id === planId);
    if (!plan) return;

    const current = getEditablePlan(plan);
    updatePlanField(planId, 'features', [...current.features, '']);
  };

  const updateFeature = (planId: string, index: number, value: string) => {
    const plan = plans?.find((p) => p.id === planId);
    if (!plan) return;

    const current = getEditablePlan(plan);
    const newFeatures = [...current.features];
    newFeatures[index] = value;
    updatePlanField(planId, 'features', newFeatures);
  };

  const removeFeature = (planId: string, index: number) => {
    const plan = plans?.find((p) => p.id === planId);
    if (!plan) return;

    const current = getEditablePlan(plan);
    const newFeatures = current.features.filter((_, i) => i !== index);
    updatePlanField(planId, 'features', newFeatures);
  };

  const savePlan = async (planId: string) => {
    const editedPlan = editingPlans[planId];
    if (!editedPlan) return;

    setSaving((prev) => ({ ...prev, [planId]: true }));

    try {
      const { error } = await supabase
        .from('pricing_plans')
        .update({
          name: editedPlan.name,
          price_usd: editedPlan.price_usd,
          price_cop: editedPlan.price_cop,
          billing_period: editedPlan.billing_period,
          emoji: editedPlan.emoji,
          cta_text: editedPlan.cta_text,
          badge: editedPlan.badge || null,
          is_popular: editedPlan.is_popular,
          is_published: editedPlan.is_published,
          features: editedPlan.features,
        })
        .eq('id', planId);

      if (error) throw error;

      setEditingPlans((prev) => {
        const newState = { ...prev };
        delete newState[planId];
        return newState;
      });

      await refetch();
    } catch (err) {
      console.error('Error saving plan:', err);
    } finally {
      setSaving((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const createNewPlan = async () => {
    setSaving((prev) => ({ ...prev, new: true }));

    try {
      const maxSortOrder = plans?.reduce((max, p) => Math.max(max, p.sort_order), 0) || 0;

      const { error } = await supabase.from('pricing_plans').insert({
        name: 'Nuevo Plan',
        price_usd: 0,
        price_cop: 0,
        billing_period: 'mes',
        emoji: '💎',
        cta_text: 'Suscribirse',
        badge: null,
        is_popular: false,
        is_published: false,
        features: [],
        sort_order: maxSortOrder + 1,
      });

      if (error) throw error;

      await refetch();
    } catch (err) {
      console.error('Error creating plan:', err);
    } finally {
      setSaving((prev) => ({ ...prev, new: false }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Cargando planes...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Planes de Precios</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los planes de suscripción de BLANG
            </p>
          </div>
          <Button onClick={createNewPlan} disabled={saving.new}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Plan
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => {
            const editedPlan = getEditablePlan(plan);
            const hasChanges = !!editingPlans[plan.id];

            return (
              <Card key={plan.id} className="relative">
                {editedPlan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Input
                      value={editedPlan.emoji}
                      onChange={(e) => updatePlanField(plan.id, 'emoji', e.target.value)}
                      className="w-16 text-center text-2xl"
                      maxLength={2}
                    />
                    <Input
                      value={editedPlan.name}
                      onChange={(e) => updatePlanField(plan.id, 'name', e.target.value)}
                      className="flex-1"
                    />
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Precio USD</Label>
                      <Input
                        type="number"
                        value={editedPlan.price_usd}
                        onChange={(e) =>
                          updatePlanField(plan.id, 'price_usd', parseFloat(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Precio COP</Label>
                      <Input
                        type="number"
                        value={editedPlan.price_cop}
                        onChange={(e) =>
                          updatePlanField(plan.id, 'price_cop', parseFloat(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Período</Label>
                    <Input
                      value={editedPlan.billing_period}
                      onChange={(e) => updatePlanField(plan.id, 'billing_period', e.target.value)}
                      placeholder="mes, año, etc."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Texto CTA</Label>
                    <Input
                      value={editedPlan.cta_text}
                      onChange={(e) => updatePlanField(plan.id, 'cta_text', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Badge (opcional)</Label>
                    <Input
                      value={editedPlan.badge || ''}
                      onChange={(e) => updatePlanField(plan.id, 'badge', e.target.value || null)}
                      placeholder="Ej: Ahorra 20%"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Plan Popular</Label>
                    <Switch
                      checked={editedPlan.is_popular}
                      onCheckedChange={(checked) => updatePlanField(plan.id, 'is_popular', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Publicado</Label>
                    <Switch
                      checked={editedPlan.is_published}
                      onCheckedChange={(checked) =>
                        updatePlanField(plan.id, 'is_published', checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Características</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFeature(plan.id)}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {editedPlan.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(plan.id, index, e.target.value)}
                            placeholder="Característica"
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFeature(plan.id, index)}
                            className="shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => savePlan(plan.id)}
                    disabled={!hasChanges || saving[plan.id]}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving[plan.id] ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
