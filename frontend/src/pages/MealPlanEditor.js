import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical, Trash2, Copy, Search } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { mockFoods, mockMeals, householdMeasures } from '@/data/mockData';

const SortableFood = ({ food, onRemove, onUpdate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: food.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const foodData = mockFoods.find(f => f.id === food.foodId);
  
  const calculateNutrients = () => {
    if (!foodData) return { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0 };
    const multiplier = food.quantity / foodData.porcao;
    return {
      calorias: (foodData.calorias * multiplier).toFixed(0),
      proteina: (foodData.proteina * multiplier).toFixed(1),
      carboidrato: (foodData.carboidrato * multiplier).toFixed(1),
      gordura: (foodData.gordura * multiplier).toFixed(1),
    };
  };

  const nutrients = calculateNutrients();

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical size={20} />
        </div>
        
        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <p className="font-medium text-gray-900">{foodData?.name}</p>
            <p className="text-xs text-gray-500">{foodData?.source}</p>
          </div>
          
          <div className="col-span-3 flex gap-2">
            <Input
              type="number"
              value={food.quantity}
              onChange={(e) => onUpdate(food.id, 'quantity', parseFloat(e.target.value) || 0)}
              className="w-20 text-sm"
            />
            <Select value={food.unit} onValueChange={(v) => onUpdate(food.id, 'unit', v)}>
              <SelectTrigger className="w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {householdMeasures.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-4 flex gap-3 text-xs">
            <span className="font-semibold text-teal-700">{nutrients.calorias} kcal</span>
            <span className="text-gray-600">P: {nutrients.proteina}g</span>
            <span className="text-gray-600">C: {nutrients.carboidrato}g</span>
            <span className="text-gray-600">G: {nutrients.gordura}g</span>
          </div>
          
          <div className="col-span-1 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(food.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MealSection = ({ meal, onAddFood, onRemoveFood, onUpdateFood, onDuplicateMeal }) => {
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = meal.foods.findIndex((f) => f.id === active.id);
      const newIndex = meal.foods.findIndex((f) => f.id === over.id);
      const newFoods = arrayMove(meal.foods, oldIndex, newIndex);
      meal.foods = newFoods;
    }
  };

  const calculateMealTotals = () => {
    return meal.foods.reduce((totals, food) => {
      const foodData = mockFoods.find(f => f.id === food.foodId);
      if (!foodData) return totals;
      const multiplier = food.quantity / foodData.porcao;
      return {
        calorias: totals.calorias + (foodData.calorias * multiplier),
        proteina: totals.proteina + (foodData.proteina * multiplier),
        carboidrato: totals.carboidrato + (foodData.carboidrato * multiplier),
        gordura: totals.gordura + (foodData.gordura * multiplier),
      };
    }, { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0 });
  };

  const totals = calculateMealTotals();
  const filteredFoods = mockFoods.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFood = () => {
    if (selectedFoodId) {
      onAddFood(meal.id, {
        id: `f${Date.now()}`,
        foodId: parseInt(selectedFoodId),
        quantity,
        unit,
        measure: ''
      });
      setIsAddingFood(false);
      setSearchTerm('');
      setSelectedFoodId(null);
      setQuantity(100);
      setUnit('g');
    }
  };

  return (
    <Card className="border-l-4" style={{ borderLeftColor: meal.color || '#0F766E' }}>
      <CardHeader className="bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{meal.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{meal.time}</p>
          </div>
          <div className="flex gap-2">
            <Button
              data-testid={`duplicate-meal-${meal.id}`}
              onClick={() => onDuplicateMeal(meal.id)}
              variant="outline"
              size="sm"
              className="text-teal-700 border-teal-700 hover:bg-teal-50"
            >
              <Copy size={16} className="mr-2" />
              Duplicar
            </Button>
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-sm bg-white p-3 rounded-lg border border-gray-200">
          <span className="font-semibold text-teal-700">{totals.calorias.toFixed(0)} kcal</span>
          <span className="text-gray-700">Prote\u00edna: {totals.proteina.toFixed(1)}g</span>
          <span className="text-gray-700">Carboidrato: {totals.carboidrato.toFixed(1)}g</span>
          <span className="text-gray-700">Gordura: {totals.gordura.toFixed(1)}g</span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={meal.foods.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {meal.foods.map((food) => (
                <SortableFood
                  key={food.id}
                  food={food}
                  onRemove={onRemoveFood}
                  onUpdate={onUpdateFood}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Dialog open={isAddingFood} onOpenChange={setIsAddingFood}>
          <DialogTrigger asChild>
            <Button
              data-testid={`add-food-${meal.id}`}
              className="w-full mt-4 border-dashed bg-teal-50 text-teal-700 hover:bg-teal-100"
              variant="outline"
            >
              <Plus size={16} className="mr-2" />
              Adicionar Alimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Alimento</DialogTitle>
              <DialogDescription>Busque e adicione um alimento ao plano alimentar</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Buscar Alimento</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <Input
                    placeholder="Digite o nome do alimento ou fonte (TACO, USDA...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFoodId(food.id)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      selectedFoodId === food.id ? 'bg-teal-50 border-l-4 border-l-teal-700' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900">{food.name}</p>
                    <p className="text-xs text-gray-500">
                      {food.source} • {food.calorias} kcal por {food.porcao}{food.unidade}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Medida</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {householdMeasures.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddFood} className="w-full bg-teal-700 hover:bg-teal-800" disabled={!selectedFoodId}>
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const MealPlanEditor = () => {
  const [meals, setMeals] = useState([
    { ...mockMeals[0], foods: [] },
    { ...mockMeals[2], foods: [] },
    { ...mockMeals[4], foods: [] }
  ]);

  const addFoodToMeal = (mealId, food) => {
    setMeals(meals.map(m => 
      m.id === mealId ? { ...m, foods: [...m.foods, food] } : m
    ));
  };

  const removeFoodFromMeal = (foodId) => {
    setMeals(meals.map(m => ({
      ...m,
      foods: m.foods.filter(f => f.id !== foodId)
    })));
  };

  const updateFood = (foodId, field, value) => {
    setMeals(meals.map(m => ({
      ...m,
      foods: m.foods.map(f => 
        f.id === foodId ? { ...f, [field]: value } : f
      )
    })));
  };

  const duplicateMeal = (mealId) => {
    const mealToDuplicate = meals.find(m => m.id === mealId);
    if (mealToDuplicate) {
      const newMeal = {
        ...mealToDuplicate,
        id: `m${Date.now()}`,
        name: `${mealToDuplicate.name} (C\u00f3pia)`,
        foods: mealToDuplicate.foods.map(f => ({ ...f, id: `f${Date.now()}_${f.id}` }))
      };
      setMeals([...meals, newMeal]);
    }
  };

  const calculateDayTotals = () => {
    return meals.reduce((totals, meal) => {
      meal.foods.forEach(food => {
        const foodData = mockFoods.find(f => f.id === food.foodId);
        if (foodData) {
          const multiplier = food.quantity / foodData.porcao;
          totals.calorias += foodData.calorias * multiplier;
          totals.proteina += foodData.proteina * multiplier;
          totals.carboidrato += foodData.carboidrato * multiplier;
          totals.gordura += foodData.gordura * multiplier;
        }
      });
      return totals;
    }, { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0 });
  };

  const dayTotals = calculateDayTotals();

  return (
    <Layout title="Editor de Plano Alimentar" showBack userType="professional">
      <div data-testid="meal-plan-editor" className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          {meals.map((meal) => (
            <MealSection
              key={meal.id}
              meal={meal}
              onAddFood={addFoodToMeal}
              onRemoveFood={removeFoodFromMeal}
              onUpdateFood={updateFood}
              onDuplicateMeal={duplicateMeal}
            />
          ))}
        </div>

        <div className="col-span-4">
          <Card className="sticky top-6">
            <CardHeader className="bg-gradient-to-br from-teal-700 to-teal-600 text-white">
              <CardTitle>Resumo Nutricional</CardTitle>
              <p className="text-sm text-teal-100">Total do dia</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-sm text-gray-600">Calorias Totais</p>
                  <p className="text-3xl font-bold text-teal-700">{dayTotals.calorias.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Prote\u00edna</span>
                    <span className="text-lg font-bold text-gray-900">{dayTotals.proteina.toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Carboidrato</span>
                    <span className="text-lg font-bold text-gray-900">{dayTotals.carboidrato.toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Gordura</span>
                    <span className="text-lg font-bold text-gray-900">{dayTotals.gordura.toFixed(1)}g</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full bg-teal-700 hover:bg-teal-800" size="lg">
                    Salvar Plano
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MealPlanEditor;
