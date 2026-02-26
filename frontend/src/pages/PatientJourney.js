import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, Loader2, Plus, Calendar, Camera, Scale, 
  ChevronDown, ChevronUp, Target, Award, Ruler,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientJourney, createJourneyEntry, getPatientMealPlan } from '@/lib/supabase';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientJourney = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [journeyEntries, setJourneyEntries] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    weight: '',
    body_fat_percentage: '',
    waist_cm: '',
    hip_cm: '',
    notes: ''
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [journeyResult, planResult] = await Promise.all([
        getPatientJourney(user.id),
        getPatientMealPlan(user.id)
      ]);
      
      setJourneyEntries(journeyResult.data || []);
      setActivePlan(planResult.data);
    } catch (error) {
      console.error('Error loading journey:', error);
      toast.error('Erro ao carregar jornada');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    try {
      const entryData = {
        patient_id: user.id,
        record_date: new Date().toISOString().split('T')[0],
        weight: newEntry.weight ? parseFloat(newEntry.weight) : null,
        body_fat_percentage: newEntry.body_fat_percentage ? parseFloat(newEntry.body_fat_percentage) : null,
        waist_cm: newEntry.waist_cm ? parseFloat(newEntry.waist_cm) : null,
        hip_cm: newEntry.hip_cm ? parseFloat(newEntry.hip_cm) : null,
        notes: newEntry.notes || null,
        meal_plan_id: activePlan?.id || null
      };
      
      const { error } = await createJourneyEntry(entryData);
      if (error) throw error;
      
      toast.success('Registro adicionado!');
      setShowAddModal(false);
      setNewEntry({ weight: '', body_fat_percentage: '', waist_cm: '', hip_cm: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Erro ao adicionar registro');
    }
  };

  // Calcular estatísticas
  const getStats = () => {
    if (journeyEntries.length === 0) return null;
    
    const firstEntry = journeyEntries[journeyEntries.length - 1];
    const lastEntry = journeyEntries[0];
    const goalWeight = profile?.goal_weight;
    
    const weightChange = firstEntry.weight && lastEntry.weight 
      ? (lastEntry.weight - firstEntry.weight).toFixed(1) 
      : null;
    
    const daysOnPlan = activePlan?.created_at 
      ? Math.floor((new Date() - new Date(activePlan.created_at)) / (1000 * 60 * 60 * 24))
      : null;
    
    const progressToGoal = goalWeight && lastEntry.weight && firstEntry.weight
      ? Math.min(100, Math.max(0, ((firstEntry.weight - lastEntry.weight) / (firstEntry.weight - goalWeight)) * 100))
      : null;
    
    return {
      currentWeight: lastEntry.weight,
      startWeight: firstEntry.weight,
      weightChange,
      goalWeight,
      daysOnPlan,
      progressToGoal,
      totalEntries: journeyEntries.length
    };
  };

  const stats = getStats();

  // Preparar dados para o gráfico
  const chartData = journeyEntries
    .slice()
    .reverse()
    .map(entry => ({
      date: new Date(entry.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      peso: entry.weight,
      gordura: entry.body_fat_percentage
    }))
    .filter(d => d.peso);

  const getWeightChangeIcon = (change) => {
    if (!change) return <Minus className="text-gray-400" />;
    const num = parseFloat(change);
    if (num < 0) return <ArrowDown className="text-green-500" />;
    if (num > 0) return <ArrowUp className="text-red-500" />;
    return <Minus className="text-gray-400" />;
  };

  if (loading) {
    return (
      <Layout title="Minha Jornada" userType="patient">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Minha Jornada" userType="patient">
      <div className="space-y-6">
        {/* Header com estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100">
              <CardContent className="p-4 text-center">
                <Scale className="mx-auto text-teal-600 mb-2" size={24} />
                <p className="text-2xl font-bold text-teal-800">{stats.currentWeight || '--'} kg</p>
                <p className="text-sm text-teal-600">Peso Atual</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4 text-center">
                <Target className="mx-auto text-blue-600 mb-2" size={24} />
                <p className="text-2xl font-bold text-blue-800">{stats.goalWeight || '--'} kg</p>
                <p className="text-sm text-blue-600">Meta</p>
              </CardContent>
            </Card>
            
            <Card className={`bg-gradient-to-br ${parseFloat(stats.weightChange) <= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'}`}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  {getWeightChangeIcon(stats.weightChange)}
                </div>
                <p className={`text-2xl font-bold ${parseFloat(stats.weightChange) <= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {stats.weightChange || '--'} kg
                </p>
                <p className={`text-sm ${parseFloat(stats.weightChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Variação Total
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4 text-center">
                <Calendar className="mx-auto text-purple-600 mb-2" size={24} />
                <p className="text-2xl font-bold text-purple-800">{stats.daysOnPlan || '--'}</p>
                <p className="text-sm text-purple-600">Dias de Plano</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barra de progresso */}
        {stats?.progressToGoal !== null && stats.progressToGoal >= 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso para a meta</span>
                <span className="text-sm font-bold text-teal-700">{stats.progressToGoal.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.progressToGoal)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Início: {stats.startWeight}kg</span>
                <span>Meta: {stats.goalWeight}kg</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do plano ativo */}
        {activePlan && (
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Plano Atual: {activePlan.name}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Início: {new Date(activePlan.created_at).toLocaleDateString('pt-BR')}</span>
                {activePlan.end_date && (
                  <>
                    <span>•</span>
                    <span>Fim: {new Date(activePlan.end_date).toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span className="text-teal-700 font-medium">
                      Restam: {Math.max(0, Math.ceil((new Date(activePlan.end_date) - new Date()) / (1000 * 60 * 60 * 24)))} dias
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de evolução */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Peso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} fontSize={12} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="#0F766E" 
                      strokeWidth={2}
                      dot={{ fill: '#0F766E', strokeWidth: 2 }}
                      name="Peso (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de adicionar registro */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="w-full bg-teal-700 hover:bg-teal-800" size="lg">
              <Plus className="mr-2" size={20} />
              Adicionar Registro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Registro</DialogTitle>
              <DialogDescription>
                Registre suas medidas de hoje
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEntry.weight}
                    onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })}
                    placeholder="70.5"
                  />
                </div>
                <div>
                  <Label>% Gordura</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEntry.body_fat_percentage}
                    onChange={(e) => setNewEntry({ ...newEntry, body_fat_percentage: e.target.value })}
                    placeholder="20.0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cintura (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEntry.waist_cm}
                    onChange={(e) => setNewEntry({ ...newEntry, waist_cm: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label>Quadril (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEntry.hip_cm}
                    onChange={(e) => setNewEntry({ ...newEntry, hip_cm: e.target.value })}
                    placeholder="95"
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Como você está se sentindo? Alguma observação..."
                />
              </div>
              <Button onClick={handleAddEntry} className="w-full bg-teal-700">
                Salvar Registro
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Histórico */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Histórico</h2>
          
          {journeyEntries.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum registro ainda
                </h3>
                <p className="text-gray-600">
                  Comece registrando seu peso e medidas para acompanhar sua evolução.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {journeyEntries.map((entry, index) => {
                const prevEntry = journeyEntries[index + 1];
                const weightDiff = prevEntry?.weight && entry.weight 
                  ? (entry.weight - prevEntry.weight).toFixed(1)
                  : null;
                
                return (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardContent 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">
                              {new Date(entry.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(entry.record_date).getFullYear()}
                            </p>
                          </div>
                          <div className="h-12 w-px bg-gray-200" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-900">
                                {entry.weight ? `${entry.weight} kg` : '--'}
                              </span>
                              {weightDiff && (
                                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                                  parseFloat(weightDiff) <= 0 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                                </span>
                              )}
                            </div>
                            {entry.body_fat_percentage && (
                              <p className="text-sm text-gray-500">
                                {entry.body_fat_percentage}% gordura
                              </p>
                            )}
                          </div>
                        </div>
                        {expandedEntry === entry.id ? (
                          <ChevronUp className="text-gray-400" />
                        ) : (
                          <ChevronDown className="text-gray-400" />
                        )}
                      </div>
                      
                      {/* Detalhes expandidos */}
                      {expandedEntry === entry.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {(entry.waist_cm || entry.hip_cm) && (
                            <div className="grid grid-cols-2 gap-4">
                              {entry.waist_cm && (
                                <div className="flex items-center gap-2">
                                  <Ruler className="text-gray-400" size={16} />
                                  <span className="text-sm text-gray-600">
                                    Cintura: <span className="font-medium">{entry.waist_cm} cm</span>
                                  </span>
                                </div>
                              )}
                              {entry.hip_cm && (
                                <div className="flex items-center gap-2">
                                  <Ruler className="text-gray-400" size={16} />
                                  <span className="text-sm text-gray-600">
                                    Quadril: <span className="font-medium">{entry.hip_cm} cm</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {entry.notes && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{entry.notes}</p>
                            </div>
                          )}
                          {entry.meal_plan?.name && (
                            <p className="text-xs text-gray-500">
                              Plano: {entry.meal_plan.name}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PatientJourney;
