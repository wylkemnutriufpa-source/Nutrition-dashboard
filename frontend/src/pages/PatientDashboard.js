import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Droplet, Footprints, Dumbbell, AlertTriangle, Loader2, Utensils } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientStats } from '@/lib/supabase';
import { toast } from 'sonner';
import ChecklistSimple from '@/components/ChecklistSimple';

const PatientDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [anamnesis, setAnamnesis] = useState(null);

  useEffect(() => {
    if (user) {
      loadPatientData();
    }
  }, [user]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const stats = await getPatientStats(user.id);
      setPatientData(stats.profile);
      setActivePlan(stats.activePlan);
      setAnamnesis(stats.anamnesis);
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!patientData?.current_weight || !patientData?.goal_weight) return 0;
    const startWeight = patientData.current_weight + 5; // Assumindo que começou 5kg acima
    const current = patientData.current_weight;
    const goal = patientData.goal_weight;
    const totalToLose = startWeight - goal;
    const lost = startWeight - current;
    return Math.min(100, Math.max(0, (lost / totalToLose) * 100));
  };

  const getGoalLabel = (goal) => {
    const goals = {
      'weight_loss': 'Emagrecimento',
      'muscle_gain': 'Ganho de Massa Muscular',
      'maintenance': 'Manutenção',
      'health': 'Saúde/Reeducação Alimentar',
      'sports': 'Performance Esportiva',
      'other': 'Outro'
    };
    return goals[goal] || goal || 'Não definido';
  };

  // Tasks mockadas (podem ser integradas com um sistema de tarefas real futuramente)
  const tasks = [
    { id: 1, title: 'Beber 2.5L de água', completed: true, icon: Droplet },
    { id: 2, title: 'Caminhar 10.000 passos', completed: false, icon: Footprints },
    { id: 3, title: 'Treinar 30 minutos', completed: true, icon: Dumbbell },
    { id: 4, title: 'Seguir plano alimentar', completed: false, icon: CheckCircle2 }
  ];

  const tips = [
    'Lembre-se de beber água ao longo do dia',
    'Evite pular refeições',
    'Inclua vegetais em todas as refeições principais'
  ];

  if (loading) {
    return (
      <Layout title="Dashboard" userType="patient">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  const patientName = patientData?.name || profile?.name || 'Paciente';
  const progress = calculateProgress();

  return (
    <Layout title={`Olá, ${patientName.split(' ')[0]}!`} userType="patient">
      <div data-testid="patient-dashboard" className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Peso Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {patientData?.current_weight ? `${patientData.current_weight} kg` : '--'}
              </p>
              {patientData?.current_weight && patientData?.goal_weight && (
                <p className="text-sm text-green-600 mt-1">
                  Meta: {patientData.goal_weight} kg
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Objetivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-gray-900">{getGoalLabel(patientData?.goal)}</p>
              {patientData?.current_weight && patientData?.goal_weight && (
                <p className="text-sm text-gray-600 mt-1">
                  Faltam {Math.abs(patientData.current_weight - patientData.goal_weight).toFixed(1)} kg
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-700">{progress.toFixed(0)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-teal-700 h-2 rounded-full transition-all" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plano Alimentar Ativo */}
        {activePlan && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="mr-2 text-green-600" size={20} />
                Plano Alimentar Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{activePlan.name}</h3>
                  <p className="text-sm text-gray-600">
                    Atualizado em: {new Date(activePlan.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {activePlan.daily_targets && (
                  <div className="flex gap-4 text-sm">
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full">
                      {activePlan.daily_targets.calorias?.toFixed(0) || 0} kcal
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      P: {activePlan.daily_targets.proteina?.toFixed(0) || 0}g
                    </span>
                  </div>
                )}
              </div>
              
              {/* Resumo das refeições */}
              {activePlan.plan_data?.meals && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {activePlan.plan_data.meals.slice(0, 3).map((meal) => (
                    <div 
                      key={meal.id} 
                      className="p-3 bg-gray-50 rounded-lg border-l-4"
                      style={{ borderLeftColor: meal.color || '#0F766E' }}
                    >
                      <p className="font-medium text-gray-900 text-sm">{meal.name}</p>
                      <p className="text-xs text-gray-600">{meal.time}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {meal.foods?.length || 0} alimentos
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarefas do Dia */}
          <Card>
            <CardHeader>
              <CardTitle>Tarefas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {task.completed ? (
                        <CheckCircle2 className="text-green-600" size={24} />
                      ) : (
                        <Circle className="text-gray-400" size={24} />
                      )}
                      <Icon className="text-teal-700" size={20} />
                      <span className={`flex-1 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                        {task.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle>Dicas do Nutricionista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="p-3 bg-teal-50 border-l-4 border-teal-700 rounded">
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas da Anamnese */}
        {anamnesis && anamnesis.conditions && anamnesis.conditions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 text-amber-600" size={20} />
                Alertas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anamnesis.conditions.map((alert, index) => (
                  <div key={index} className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <p className="font-semibold text-amber-900">{alert.condition}</p>
                    <p className="text-sm text-amber-700 mt-1">{alert.alert}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há plano */}
        {!activePlan && (
          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="py-8 text-center">
              <Utensils className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum plano alimentar ativo
              </h3>
              <p className="text-gray-600">
                Seu nutricionista ainda não criou um plano alimentar para você.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PatientDashboard;
