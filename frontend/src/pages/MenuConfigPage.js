import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Loader2, Save, GripVertical, Eye, EyeOff, 
  RotateCcw, Home, Utensils, ClipboardList, MessageSquare,
  ChefHat, ShoppingCart, Pill, Lightbulb, TrendingUp, Calculator
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientMenuConfig, saveMenuConfig, getDefaultMenuItems } from '@/lib/supabase';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const iconMap = {
  Home, Utensils, ClipboardList, MessageSquare, ChefHat,
  ShoppingCart, Pill, Lightbulb, TrendingUp, Calculator
};

const MenuConfigPage = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    if (user && profile) loadMenuConfig();
  }, [user, profile]);

  const loadMenuConfig = async () => {
    setLoading(true);
    try {
      // Carrega config padrão do profissional (patient_id = null)
      const { data } = await getPatientMenuConfig(null, user.id);
      setMenuItems(data?.items || getDefaultMenuItems());
    } catch (error) {
      console.error('Error loading menu config:', error);
      setMenuItems(getDefaultMenuItems());
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await saveMenuConfig(user.id, null, menuItems);
      if (error) throw error;
      toast.success('Configuração do menu salva!');
    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMenuItems(getDefaultMenuItems());
    toast.info('Menu restaurado para padrão');
  };

  const toggleVisibility = (index) => {
    const updated = [...menuItems];
    updated[index].visible = !updated[index].visible;
    setMenuItems(updated);
  };

  const updateLabel = (index, newLabel) => {
    const updated = [...menuItems];
    updated[index].label = newLabel;
    setMenuItems(updated);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Atualiza o order de cada item
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    setMenuItems(updatedItems);
  };

  const getIcon = (iconName) => {
    return iconMap[iconName] || Home;
  };

  if (loading) {
    return (
      <Layout title="Configurar Menu do Paciente" userType={profile?.role || 'professional'}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Configurar Menu do Paciente" userType={profile?.role || 'professional'}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="text-teal-600" size={24} />
              Menu "Meu Projeto"
            </CardTitle>
            <CardDescription>
              Configure quais itens aparecerão no menu lateral dos seus pacientes.
              Você pode renomear, ocultar ou reordenar os itens arrastando-os.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menu-items">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {menuItems
                      .sort((a, b) => a.order - b.order)
                      .map((item, index) => {
                        const Icon = getIcon(item.icon);
                        return (
                          <Draggable key={item.key} draggableId={item.key} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                  snapshot.isDragging 
                                    ? 'bg-teal-50 border-teal-300 shadow-lg' 
                                    : item.visible 
                                      ? 'bg-white border-gray-200 hover:border-gray-300' 
                                      : 'bg-gray-50 border-gray-200 opacity-60'
                                }`}
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                >
                                  <GripVertical size={20} />
                                </div>
                                
                                <div className={`p-2 rounded-lg ${item.visible ? 'bg-teal-100' : 'bg-gray-200'}`}>
                                  <Icon size={18} className={item.visible ? 'text-teal-700' : 'text-gray-500'} />
                                </div>
                                
                                <div className="flex-1">
                                  <Input
                                    value={item.label}
                                    onChange={(e) => updateLabel(index, e.target.value)}
                                    className="h-8 text-sm"
                                    disabled={!item.visible}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">{item.route}</p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleVisibility(index)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      item.visible 
                                        ? 'text-teal-600 hover:bg-teal-50' 
                                        : 'text-gray-400 hover:bg-gray-100'
                                    }`}
                                    title={item.visible ? 'Ocultar item' : 'Mostrar item'}
                                  >
                                    {item.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview do Menu</CardTitle>
            <CardDescription>
              Como o menu aparecerá para seus pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-1">
                {menuItems
                  .filter(item => item.visible)
                  .sort((a, b) => a.order - b.order)
                  .map(item => {
                    const Icon = getIcon(item.icon);
                    return (
                      <div 
                        key={item.key}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="mr-2" size={16} />
            Restaurar Padrão
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-teal-700 hover:bg-teal-800"
          >
            {saving ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Save className="mr-2" size={16} />
            )}
            Salvar Configuração
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default MenuConfigPage;
