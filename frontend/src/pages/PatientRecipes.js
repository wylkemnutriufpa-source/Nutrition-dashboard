import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChefHat, Clock, Users, Search, Loader2, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRecipes } from '@/lib/supabase';
import { toast } from 'sonner';

const PatientRecipes = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    if (user) loadRecipes();
  }, [user]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      // Busca o professional_id do paciente através do patient_profiles
      const professionalId = profile?.professional_id;
      const { data, error } = await getRecipes(professionalId, user.id);
      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast.error('Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'café da manhã', 'almoço', 'jantar', 'lanche', 'sobremesa'];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'café da manhã': 'bg-yellow-100 text-yellow-700',
      'almoço': 'bg-orange-100 text-orange-700',
      'jantar': 'bg-purple-100 text-purple-700',
      'lanche': 'bg-green-100 text-green-700',
      'sobremesa': 'bg-pink-100 text-pink-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Layout title="Minhas Receitas" userType="patient">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  // Visualização detalhada de uma receita
  if (selectedRecipe) {
    return (
      <Layout title="Minhas Receitas" userType="patient">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedRecipe(null)}
            className="mb-4"
          >
            ← Voltar para receitas
          </Button>
          
          <Card>
            {selectedRecipe.image_url && (
              <img 
                src={selectedRecipe.image_url} 
                alt={selectedRecipe.name}
                className="w-full h-64 object-cover rounded-t-lg"
              />
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{selectedRecipe.name}</CardTitle>
                {selectedRecipe.category && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedRecipe.category)}`}>
                    {selectedRecipe.category}
                  </span>
                )}
              </div>
              {selectedRecipe.description && (
                <CardDescription>{selectedRecipe.description}</CardDescription>
              )}
              
              <div className="flex gap-4 mt-4">
                {selectedRecipe.prep_time_minutes && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={18} />
                    <span>{selectedRecipe.prep_time_minutes} min</span>
                  </div>
                )}
                {selectedRecipe.servings && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span>{selectedRecipe.servings} porções</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Informações Nutricionais */}
              {(selectedRecipe.calories || selectedRecipe.protein) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Informações Nutricionais (por porção)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedRecipe.calories && (
                      <div className="p-3 bg-teal-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-teal-700">{selectedRecipe.calories}</p>
                        <p className="text-sm text-gray-600">kcal</p>
                      </div>
                    )}
                    {selectedRecipe.protein && (
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">{selectedRecipe.protein}g</p>
                        <p className="text-sm text-gray-600">Proteína</p>
                      </div>
                    )}
                    {selectedRecipe.carbs && (
                      <div className="p-3 bg-yellow-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-700">{selectedRecipe.carbs}g</p>
                        <p className="text-sm text-gray-600">Carboidrato</p>
                      </div>
                    )}
                    {selectedRecipe.fat && (
                      <div className="p-3 bg-orange-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-700">{selectedRecipe.fat}g</p>
                        <p className="text-sm text-gray-600">Gordura</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Ingredientes */}
              {selectedRecipe.ingredients?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Ingredientes</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                        <span className="font-medium">{ing.quantity} {ing.unit}</span>
                        <span className="text-gray-600">{ing.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Modo de Preparo */}
              {selectedRecipe.instructions?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Modo de Preparo</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <p className="text-gray-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Minhas Receitas" userType="patient">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar receitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'bg-teal-700' : ''}
              >
                {cat === 'all' ? 'Todas' : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Receitas */}
        {filteredRecipes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <UtensilsCrossed className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma receita disponível
              </h3>
              <p className="text-gray-600">
                Seu nutricionista ainda não compartilhou receitas com você.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                {recipe.image_url ? (
                  <img 
                    src={recipe.image_url} 
                    alt={recipe.name}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-teal-100 to-green-100 rounded-t-lg flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-teal-600" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{recipe.description}</p>
                      )}
                    </div>
                    <ChevronRight className="text-gray-400 flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    {recipe.prep_time_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {recipe.prep_time_minutes} min
                      </span>
                    )}
                    {recipe.category && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(recipe.category)}`}>
                        {recipe.category}
                      </span>
                    )}
                  </div>
                  
                  {recipe.calories && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-teal-700">{recipe.calories} kcal</span> por porção
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PatientRecipes;
