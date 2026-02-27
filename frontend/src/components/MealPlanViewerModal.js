import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Utensils, Clock, Flame, AlertCircle, Edit, Download, 
  ChevronRight, Apple, Coffee, Sun, Moon, X
} from 'lucide-react';
import { generateMealPlanPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

const MealIcon = ({ mealName }) => {
  const name = mealName?.toLowerCase() || '';
  if (name.includes('café') || name.includes('desjejum')) return <Coffee className="text-amber-600" size={18} />;
  if (name.includes('almoço') || name.includes('almoco')) return <Sun className="text-orange-500" size={18} />;
  if (name.includes('jantar') || name.includes('janta')) return <Moon className="text-indigo-600" size={18} />;
  if (name.includes('lanche')) return <Apple className="text-green-600" size={18} />;
  return <Utensils className="text-teal-600" size={18} />;
};

const NutrientBadge = ({ label, value, unit, color }) => (
  <div className={`px-3 py-2 rounded-lg ${color} flex flex-col items-center`}>
    <span className="text-xs text-gray-600">{label}</span>
    <span className="font-bold text-gray-900">{value || 0}{unit}</span>
  </div>
);

const MealCard = ({ meal, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  
  const calculateMealTotals = () => {
    if (!meal.foods || !Array.isArray(meal.foods)) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return meal.foods.reduce((acc, food) => ({
      calories: acc.calories + (parseFloat(food.calories) || 0),
      protein: acc.protein + (parseFloat(food.protein) || 0),
      carbs: acc.carbs + (parseFloat(food.carbs) || 0),
      fat: acc.fat + (parseFloat(food.fat) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };
  
  const totals = calculateMealTotals();
  
  return (
    <div 
      className={`p-4 bg-white rounded-xl border hover:border-teal-300 transition-all ${!isLast ? 'mb-3' : ''}`}
      style={{ borderLeftColor: meal.color || '#0F766E', borderLeftWidth: '4px' }}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <MealIcon mealName={meal.name} />
          <div>
            <h4 className="font-semibold text-gray-900">{meal.name}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>{meal.time || 'Horário não definido'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50">
            <Flame size={12} className="mr-1" />
            {totals.calories.toFixed(0)} kcal
          </Badge>
          <ChevronRight 
            size={20} 
            className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </div>
      </div>
      
      {expanded && meal.foods && meal.foods.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            {meal.foods.map((food, idx) => (
              <div 
                key={food.id || idx}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{food.name}</span>
                  {food.customName && food.customName !== food.name && (
                    <span className="ml-2 text-xs text-teal-600">({food.customName})</span>
                  )}
                  <p className="text-sm text-gray-500">{food.quantity}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded">{food.calories || 0} kcal</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded hidden sm:block">P: {food.protein || 0}g</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Observações do alimento */}
          {meal.foods.some(f => f.observations) && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-1">Observações:</p>
              {meal.foods.filter(f => f.observations).map((food, idx) => (
                <p key={idx} className="text-sm text-amber-700">
                  <strong>{food.name}:</strong> {food.observations}
                </p>
              ))}
            </div>
          )}
          
          {/* Totais da refeição */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <NutrientBadge label="Calorias" value={totals.calories.toFixed(0)} unit=" kcal" color="bg-teal-50" />
            <NutrientBadge label="Proteína" value={totals.protein.toFixed(1)} unit="g" color="bg-blue-50" />
            <NutrientBadge label="Carboidratos" value={totals.carbs.toFixed(1)} unit="g" color="bg-orange-50" />
            <NutrientBadge label="Gordura" value={totals.fat.toFixed(1)} unit="g" color="bg-purple-50" />
          </div>
        </div>
      )}
    </div>
  );
};

const MealPlanViewerModal = ({ 
  isOpen, 
  onClose, 
  mealPlan, 
  patient, 
  professionalInfo,
  onEdit 
}) => {
  const [activeTab, setActiveTab] = useState('refeicoes');
  
  if (!mealPlan) return null;
  
  const meals = mealPlan.plan_data?.meals || mealPlan.meals || [];
  const dailyTargets = mealPlan.daily_targets || {};
  
  // Calcular totais do dia
  const calculateDayTotals = () => {
    return meals.reduce((dayAcc, meal) => {
      const mealTotals = (meal.foods || []).reduce((acc, food) => ({
        calories: acc.calories + (parseFloat(food.calories) || 0),
        protein: acc.protein + (parseFloat(food.protein) || 0),
        carbs: acc.carbs + (parseFloat(food.carbs) || 0),
        fat: acc.fat + (parseFloat(food.fat) || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      return {
        calories: dayAcc.calories + mealTotals.calories,
        protein: dayAcc.protein + mealTotals.protein,
        carbs: dayAcc.carbs + mealTotals.carbs,
        fat: dayAcc.fat + mealTotals.fat,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };
  
  const dayTotals = calculateDayTotals();
  
  const handleExportPDF = () => {
    try {
      generateMealPlanPDF(patient, mealPlan, professionalInfo);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white mb-1">
                {mealPlan.name || 'Plano Alimentar'}
              </DialogTitle>
              <DialogDescription className="text-teal-100">
                Paciente: {patient?.name || 'Não identificado'}
              </DialogDescription>
              {mealPlan.description && (
                <p className="text-sm text-teal-200 mt-2">{mealPlan.description}</p>
              )}
            </div>
            <Badge className="bg-white/20 text-white border-0 text-sm">
              {meals.length} refeições
            </Badge>
          </div>
          
          {/* Resumo do dia */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-teal-200">Calorias</p>
              <p className="text-xl font-bold">{dayTotals.calories.toFixed(0)}</p>
              <p className="text-xs text-teal-200">
                {dailyTargets.calorias ? `/ ${dailyTargets.calorias.toFixed(0)}` : ''} kcal
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-teal-200">Proteína</p>
              <p className="text-xl font-bold">{dayTotals.protein.toFixed(0)}g</p>
              <p className="text-xs text-teal-200">
                {dailyTargets.proteina ? `/ ${dailyTargets.proteina.toFixed(0)}g` : ''}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-teal-200">Carboidratos</p>
              <p className="text-xl font-bold">{dayTotals.carbs.toFixed(0)}g</p>
              <p className="text-xs text-teal-200">
                {dailyTargets.carboidrato ? `/ ${dailyTargets.carboidrato.toFixed(0)}g` : ''}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-xs text-teal-200">Gordura</p>
              <p className="text-xl font-bold">{dayTotals.fat.toFixed(0)}g</p>
              <p className="text-xs text-teal-200">
                {dailyTargets.gordura ? `/ ${dailyTargets.gordura.toFixed(0)}g` : ''}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="refeicoes" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                <Utensils size={16} className="mr-2" /> Refeições
              </TabsTrigger>
              <TabsTrigger value="observacoes" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                <AlertCircle size={16} className="mr-2" /> Observações
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1 h-[400px]">
            <div className="p-4">
              <TabsContent value="refeicoes" className="mt-0">
                {meals.length > 0 ? (
                  <div className="space-y-3">
                    {meals.map((meal, index) => (
                      <MealCard 
                        key={meal.id || index} 
                        meal={meal} 
                        isLast={index === meals.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Utensils className="mx-auto mb-4 text-gray-400" size={48} />
                    <p>Nenhuma refeição cadastrada neste plano</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="observacoes" className="mt-0">
                <div className="space-y-4">
                  {/* Observações gerais do plano */}
                  {mealPlan.observations && (
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <AlertCircle size={16} className="mr-2 text-amber-600" />
                          Observações Gerais
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{mealPlan.observations}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Orientações */}
                  {mealPlan.orientations && (
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Orientações</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{mealPlan.orientations}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Observações dos alimentos */}
                  {meals.some(m => m.foods?.some(f => f.observations || f.customName)) && (
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Personalizações dos Alimentos</h4>
                        <div className="space-y-3">
                          {meals.map((meal, mIdx) => 
                            meal.foods?.filter(f => f.observations || f.customName).map((food, fIdx) => (
                              <div key={`${mIdx}-${fIdx}`} className="p-3 bg-gray-50 rounded-lg border-l-4 border-teal-500">
                                <p className="font-medium text-gray-900">
                                  {food.customName || food.name}
                                  <span className="text-xs text-gray-500 ml-2">({meal.name})</span>
                                </p>
                                {food.observations && (
                                  <p className="text-sm text-gray-600 mt-1">{food.observations}</p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!mealPlan.observations && !mealPlan.orientations && 
                   !meals.some(m => m.foods?.some(f => f.observations || f.customName)) && (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                      <p>Nenhuma observação cadastrada</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        
        {/* Footer com ações */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Atualizado: {mealPlan.updated_at ? new Date(mealPlan.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download size={16} className="mr-2" /> Exportar PDF
            </Button>
            {onEdit && (
              <Button className="bg-teal-700 hover:bg-teal-800" onClick={onEdit}>
                <Edit size={16} className="mr-2" /> Editar Plano
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealPlanViewerModal;
