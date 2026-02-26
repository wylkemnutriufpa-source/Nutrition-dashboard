import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, Loader2, Download, Share2, Check, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientMealPlan, generateShoppingList } from '@/lib/supabase';
import { toast } from 'sonner';

const PatientShoppingList = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shoppingList, setShoppingList] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    if (user) loadShoppingList();
  }, [user]);

  const loadShoppingList = async () => {
    setLoading(true);
    try {
      // Buscar plano ativo do paciente
      const { data: plan } = await getPatientMealPlan(user.id);
      setActivePlan(plan);
      
      if (plan) {
        const { data: list } = await generateShoppingList(plan.id);
        setShoppingList(list || {});
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
      toast.error('Erro ao carregar lista de compras');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (category, itemName) => {
    const key = `${category}-${itemName}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isChecked = (category, itemName) => {
    return checkedItems[`${category}-${itemName}`] || false;
  };

  const totalItems = Object.values(shoppingList).flat().length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const shareList = async () => {
    const listText = Object.entries(shoppingList)
      .map(([category, items]) => {
        const itemsText = items.map(item => 
          `- ${item.quantity} ${item.unit} de ${item.name}`
        ).join('\n');
        return `📦 ${category}:\n${itemsText}`;
      })
      .join('\n\n');
    
    const fullText = `🛒 Lista de Compras - ${activePlan?.name || 'Meu Plano'}\n\n${listText}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Lista de Compras',
          text: fullText
        });
      } else {
        await navigator.clipboard.writeText(fullText);
        toast.success('Lista copiada para a área de transferência!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const categoryIcons = {
    'Frutas': '🍎',
    'Verduras': '🥬',
    'Legumes': '🥕',
    'Carnes': '🥩',
    'Laticínios': '🥛',
    'Grãos': '🌾',
    'Proteínas': '🍗',
    'Outros': '📦'
  };

  if (loading) {
    return (
      <Layout title="Lista de Compras" userType="patient">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  if (!activePlan) {
    return (
      <Layout title="Lista de Compras" userType="patient">
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum plano alimentar ativo
            </h3>
            <p className="text-gray-600">
              Você precisa ter um plano alimentar ativo para gerar sua lista de compras.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const categories = Object.keys(shoppingList);

  if (categories.length === 0) {
    return (
      <Layout title="Lista de Compras" userType="patient">
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Lista vazia
            </h3>
            <p className="text-gray-600">
              Seu plano alimentar ainda não possui alimentos cadastrados.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Lista de Compras" userType="patient">
      <div className="space-y-6">
        {/* Header com progresso */}
        <Card className="bg-gradient-to-r from-teal-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Baseada no plano: {activePlan.name}</h2>
                <p className="text-gray-600">{checkedCount} de {totalItems} itens</p>
              </div>
              <Button variant="outline" onClick={shareList}>
                <Share2 className="mr-2" size={16} />
                Compartilhar
              </Button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-teal-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <div className="mt-3 flex items-center gap-2 text-green-600">
                <Check size={20} />
                <span className="font-medium">Lista completa! 🎉</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista por categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map(category => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span>{categoryIcons[category] || '📦'}</span>
                  {category}
                  <span className="text-sm font-normal text-gray-500 ml-auto">
                    {shoppingList[category].length} itens
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shoppingList[category].map((item, index) => {
                    const checked = isChecked(category, item.name);
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                          checked ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleItem(category, item.name)}
                      >
                        <Checkbox 
                          checked={checked}
                          onCheckedChange={() => toggleItem(category, item.name)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <span className={`flex-1 ${checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {item.name}
                        </span>
                        <span className={`text-sm ${checked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PatientShoppingList;
