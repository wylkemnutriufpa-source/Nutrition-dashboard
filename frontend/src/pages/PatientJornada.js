import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Calendar, Scale, Camera, 
  Plus, Target, Clock, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getPatientJourney, getWeightHistory, addWeightRecord, 
  getProgressPhotos 
} from '@/lib/supabase';

const PatientJornada = () => {
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  const patientId = localStorage.getItem('fitjourney_patient_id');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      const [journeyResult, weightResult, photosResult] = await Promise.all([
        getPatientJourney(patientId),
        getWeightHistory(patientId),
        getProgressPhotos(patientId)
      ]);

      setJourney(journeyResult.data);
      setWeightHistory(weightResult.data || []);
      setPhotos(photosResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar jornada:', error);
      toast.error('Erro ao carregar dados da jornada');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      toast.error('Digite um peso válido');
      return;
    }

    setSavingWeight(true);
    try {
      const { error } = await addWeightRecord(patientId, parseFloat(newWeight));
      
      if (error) {
        toast.error('Erro ao salvar peso');
        return;
      }

      toast.success('Peso registrado com sucesso!');
      setNewWeight('');
      setShowAddWeight(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSavingWeight(false);
    }
  };

  // Calcular estatísticas
  const calculateStats = () => {
    if (!weightHistory.length) return null;

    const firstWeight = weightHistory[0]?.weight || 0;
    const lastWeight = weightHistory[weightHistory.length - 1]?.weight || 0;
    const targetWeight = journey?.target_weight || lastWeight;
    
    const totalLost = firstWeight - lastWeight;
    const remainingToGoal = lastWeight - targetWeight;
    const progressPercent = totalLost > 0 
      ? Math.min(100, (totalLost / (firstWeight - targetWeight)) * 100) 
      : 0;

    return {
      firstWeight,
      lastWeight,
      targetWeight,
      totalLost,
      remainingToGoal,
      progressPercent
    };
  };

  // Calcular dias restantes
  const calculateDaysRemaining = () => {
    if (!journey?.plan_end_date) return null;
    
    const endDate = new Date(journey.plan_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const stats = calculateStats();
  const daysRemaining = calculateDaysRemaining();

  if (loading) {
    return (
      <Layout title="Minha Jornada" userType="patient">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando sua jornada...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Minha Jornada" userType="patient">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do Projeto */}
        {journey ? (
          <Card className="bg-gradient-to-br from-teal-600 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{journey.plan_name || 'Meu Projeto'}</h2>
                  <p className="text-white/80">Sua jornada de transformação</p>
                </div>
                <Award className="h-12 w-12 text-yellow-300" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/20 rounded-lg p-3">
                  <Calendar className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-sm text-white/80">Início</p>
                  <p className="font-bold">
                    {journey.plan_start_date 
                      ? new Date(journey.plan_start_date).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <Clock className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-sm text-white/80">Restam</p>
                  <p className="font-bold">
                    {daysRemaining !== null ? `${daysRemaining} dias` : '-'}
                  </p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <Target className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-sm text-white/80">Fim</p>
                  <p className="font-bold">
                    {journey.plan_end_date 
                      ? new Date(journey.plan_end_date).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-50 border-dashed border-2">
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum projeto ativo</h3>
              <p className="text-gray-500">
                Seu profissional ainda não configurou seu projeto. 
                Entre em contato para mais informações.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Progresso de Peso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-teal-600" />
              Evolução do Peso
            </CardTitle>
            <CardDescription>Acompanhe sua transformação</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-6">
                {/* Cards de estatísticas */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">Peso Inicial</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.firstWeight} kg</p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-teal-600 mb-1">Peso Atual</p>
                    <p className="text-2xl font-bold text-teal-700">{stats.lastWeight} kg</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-600 mb-1">Meta</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.targetWeight} kg</p>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso para a meta</span>
                    <span>{Math.round(stats.progressPercent)}%</span>
                  </div>
                  <Progress value={stats.progressPercent} className="h-3" />
                </div>

                {/* Resultado */}
                <div className={`p-4 rounded-lg ${stats.totalLost >= 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
                  <div className="flex items-center gap-2">
                    {stats.totalLost >= 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    )}
                    <span className={`font-bold ${stats.totalLost >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                      {stats.totalLost >= 0 ? `${stats.totalLost.toFixed(1)} kg perdidos!` : `${Math.abs(stats.totalLost).toFixed(1)} kg ganhos`}
                    </span>
                  </div>
                  {stats.remainingToGoal > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Faltam {stats.remainingToGoal.toFixed(1)} kg para sua meta
                    </p>
                  )}
                </div>

                {/* Histórico */}
                {weightHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">Histórico de Pesagens</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {[...weightHistory].reverse().slice(0, 10).map((record, index) => (
                        <div key={record.id || index} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm text-gray-600">
                            {new Date(record.recorded_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="font-medium">{record.weight} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Scale className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhum registro de peso ainda</p>
              </div>
            )}

            {/* Botão para adicionar peso */}
            <div className="mt-4 pt-4 border-t">
              {showAddWeight ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Seu peso hoje (kg)"
                    className="flex-1"
                  />
                  <Button onClick={handleAddWeight} disabled={savingWeight} className="bg-teal-600 hover:bg-teal-700">
                    {savingWeight ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddWeight(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowAddWeight(true)} 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Peso de Hoje
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fotos de Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              Fotos de Progresso
            </CardTitle>
            <CardDescription>Visualize sua transformação</CardDescription>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img 
                      src={photo.photo_url} 
                      alt={`Progresso ${photo.photo_type}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg">
                      {new Date(photo.taken_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhuma foto de progresso ainda</p>
                <p className="text-sm text-gray-400 mt-1">
                  Seu profissional pode adicionar fotos durante as consultas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientJornada;
