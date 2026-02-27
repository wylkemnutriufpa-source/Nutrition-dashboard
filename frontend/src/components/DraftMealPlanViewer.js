import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Plus, Trash2, Edit, Save, X, Clock, Lightbulb, 
  AlertCircle, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * DraftMealPlanViewer - Exibe e edita o pré-plano gerado pela anamnese
 * Visível APENAS para profissionais
 */
const DraftMealPlanViewer = ({ draftPlan, onUpdate, onRegenerate, loading }) => {
  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(null);

  useEffect(() => {
    if (draftPlan) {
      setEditedPlan(JSON.parse(JSON.stringify(draftPlan))); // Deep copy
    }
  }, [draftPlan]);

  if (!draftPlan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 mb-4">Nenhum pré-plano gerado ainda</p>
          <p className="text-sm text-gray-500 mb-4">
            O pré-plano será gerado automaticamente quando a anamnese for concluída
          </p>
          {onRegenerate && (
            <Button onClick={onRegenerate} variant="outline">
              <RefreshCw className="mr-2" size={16} />
              Gerar Pré-Plano Agora
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleSave = () => {
    onUpdate(editedPlan);
    setEditing(false);
    toast.success('Pré-plano atualizado!');
  };

  const handleCancel = () => {
    setEditedPlan(JSON.parse(JSON.stringify(draftPlan)));
    setEditing(false);
  };

  const addMeal = () => {
    const newMeal = {
      id: Date.now(),
      name: 'Nova Refeição',
      time: '10:00',
      foods: [],
      editable: true
    };
    setEditedPlan({
      ...editedPlan,
      meals: [...editedPlan.meals, newMeal]
    });
  };

  const removeMeal = (mealId) => {
    setEditedPlan({
      ...editedPlan,
      meals: editedPlan.meals.filter(m => m.id !== mealId)
    });
  };

  const updateMeal = (mealId, field, value) => {
    setEditedPlan({
      ...editedPlan,
      meals: editedPlan.meals.map(m =>
        m.id === mealId ? { ...m, [field]: value } : m
      )
    });
  };

  const addFoodToMeal = (mealId) => {
    setEditedPlan({
      ...editedPlan,
      meals: editedPlan.meals.map(m =>
        m.id === mealId ? { ...m, foods: [...m.foods, ''] } : m
      )
    });
  };

  const updateFoodInMeal = (mealId, foodIndex, value) => {
    setEditedPlan({
      ...editedPlan,
      meals: editedPlan.meals.map(m =>
        m.id === mealId
          ? { ...m, foods: m.foods.map((f, i) => (i === foodIndex ? value : f)) }
          : m
      )
    });
  };

  const removeFoodFromMeal = (mealId, foodIndex) => {
    setEditedPlan({
      ...editedPlan,
      meals: editedPlan.meals.map(m =>
        m.id === mealId
          ? { ...m, foods: m.foods.filter((_, i) => i !== foodIndex) }
          : m
      )
    });
  };

  const plan = editing ? editedPlan : draftPlan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-purple-600" size={24} />
                Pré-Plano Inteligente
              </CardTitle>
              <CardDescription>
                Gerado automaticamente pela anamnese • Visível apenas para você
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={loading}>
                    <X className="mr-2" size={16} />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800" disabled={loading}>
                    <Save className="mr-2" size={16} />
                    Salvar
                  </Button>
                </>
              ) : (
                <>
                  {onRegenerate && (
                    <Button variant="outline" onClick={onRegenerate} disabled={loading}>
                      <RefreshCw className="mr-2" size={16} />
                      Regenerar
                    </Button>
                  )}
                  <Button onClick={() => setEditing(true)} disabled={loading}>
                    <Edit className="mr-2" size={16} />
                    Editar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Raciocínio */}
      {plan.reasoning && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="text-purple-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-2">Análise Automática</h4>
                <p className="text-sm text-purple-800 whitespace-pre-line">{plan.reasoning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refeições */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Refeições Sugeridas</CardTitle>
            {editing && (
              <Button onClick={addMeal} variant="outline" size="sm">
                <Plus className="mr-2" size={16} />
                Adicionar Refeição
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.meals?.map((meal, index) => (
            <div key={meal.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {editing ? (
                    <>
                      <Input
                        value={meal.name}
                        onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                        className="max-w-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <Input
                          type="time"
                          value={meal.time}
                          onChange={(e) => updateMeal(meal.id, 'time', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-gray-900">{meal.name}</h4>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock size={14} />
                        {meal.time}
                      </div>
                    </>
                  )}
                </div>
                {editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMeal(meal.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {meal.foods?.map((food, foodIndex) => (
                  <div key={foodIndex} className="flex items-center gap-2">
                    {editing ? (
                      <>
                        <Input
                          value={food}
                          onChange={(e) => updateFoodInMeal(meal.id, foodIndex, e.target.value)}
                          placeholder="Nome do alimento"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFoodFromMeal(meal.id, foodIndex)}
                          className="text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-600" />
                        <span className="text-sm text-gray-700">{food}</span>
                      </div>
                    )}
                  </div>
                ))}
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addFoodToMeal(meal.id)}
                    className="mt-2"
                  >
                    <Plus size={14} className="mr-2" />
                    Adicionar Alimento
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alimentos Recomendados */}
      {plan.recommendedFoods && plan.recommendedFoods.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle2 size={20} />
              Alimentos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {plan.recommendedFoods.map((food, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  {food}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alimentos a Evitar */}
      {plan.foodsToAvoid && plan.foodsToAvoid.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle size={20} />
              Alimentos a Evitar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plan.foodsToAvoid.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <X size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-red-900">{item.food}</span>
                    {item.reason && (
                      <span className="text-sm text-red-700 ml-2">- {item.reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DraftMealPlanViewer;
