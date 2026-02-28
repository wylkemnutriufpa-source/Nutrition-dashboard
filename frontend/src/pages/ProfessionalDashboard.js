import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Users, Calendar, TrendingUp, Loader2, Utensils, Eye, Edit, ArrowRight, FileText,
  ClipboardList, Apple, Clock, Bell, CheckCircle2, AlertTriangle, Activity, Target,
  Lightbulb, Plus, Trash2, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfessionalStats, createGlobalTip, getGlobalTips, deleteGlobalTip, createGlobalTask, getGlobalTasks, deleteGlobalTask } from '@/lib/supabase';
import { toast } from 'sonner';
import MealPlanViewerModal from '@/components/MealPlanViewerModal';

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [globalTips, setGlobalTips] = useState([]);
  const [globalTasks, setGlobalTasks] = useState([]);
  const [newTip, setNewTip] = useState('');
  const [newTask, setNewTask] = useState('');
  const [addingTip, setAddingTip] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [stats, setStats] = useState({
    activePatients: 0,
    totalPatients: 0,
    activePlans: 0,
    recentPatients: [],
    patientsWithActivePlans: [],
    pendingAnamneses: 0,
    pendingAssessments: 0
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const isAdmin = profile?.role === 'admin';
      const data = await getProfessionalStats(user.id, isAdmin);
      setStats(data);
      
      // Carregar dicas e tarefas globais
      const [tipsRes, tasksRes] = await Promise.all([
        getGlobalTips(user.id),
        getGlobalTasks(user.id)
      ]);
      setGlobalTips(tipsRes.data || []);
      setGlobalTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  // Funções para Dicas Globais
  const handleAddTip = async () => {
    if (!newTip.trim()) return;
    setAddingTip(true);
    try {
      const { data, error } = await createGlobalTip(user.id, newTip);
      if (error) throw error;
      setGlobalTips([data, ...globalTips]);
      setNewTip('');
      toast.success('Dica criada! Aparecerá para todos os pacientes.');
    } catch (error) {
      toast.error('Erro ao criar dica');
    } finally {
      setAddingTip(false);
    }
  };

  const handleDeleteTip = async (tipId) => {
    try {
      await deleteGlobalTip(tipId);
      setGlobalTips(globalTips.filter(t => t.id !== tipId));
      toast.success('Dica removida');
    } catch (error) {
      toast.error('Erro ao remover dica');
    }
  };

  // Funções para Tarefas Globais
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    setAddingTask(true);
    try {
      const { data, error } = await createGlobalTask(user.id, newTask);
      if (error) throw error;
      setGlobalTasks([...globalTasks, data]);
      setNewTask('');
      toast.success('Tarefa criada! Aparecerá no checklist dos pacientes.');
    } catch (error) {
      toast.error('Erro ao criar tarefa');
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteGlobalTask(taskId);
      setGlobalTasks(globalTasks.filter(t => t.id !== taskId));
      toast.success('Tarefa removida');
    } catch (error) {
      toast.error('Erro ao remover tarefa');
    }
  };

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const handleEditPlan = (plan) => {
    navigate(`/professional/meal-plan-editor?patient=${plan.patient_id}&plan=${plan.id}`);
  };

  // Cards de estatísticas principais
  const mainStats = [
    { 
      title: 'Pacientes Ativos', 
      value: stats.activePatients, 
      icon: Users, 
      color: 'bg-teal-600',
      bgLight: 'bg-teal-50',
      textColor: 'text-teal-700',
      subtitle: `de ${stats.totalPatients} total`,
      onClick: () => navigate('/professional/patients')
    },
    { 
      title: 'Planos Ativos', 
      value: stats.activePlans, 
      icon: Utensils, 
      color: 'bg-green-600',
      bgLight: 'bg-green-50',
      textColor: 'text-green-700',
      subtitle: 'planos alimentares',
      onClick: () => navigate('/professional/meal-plans')
    },
    { 
      title: 'Taxa de Adesão', 
      value: stats.totalPatients > 0 ? Math.round((stats.activePlans / stats.totalPatients) * 100) : 0, 
      icon: TrendingUp, 
      color: 'bg-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-700',
      suffix: '%',
      subtitle: 'pacientes com plano'
    },
    { 
      title: 'Agenda Hoje', 
      value: stats.appointmentsToday || 0, 
      icon: Calendar, 
      color: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      subtitle: 'compromissos',
      onClick: () => navigate('/professional/agenda')
    }
  ];

  // Cards de ações pendentes
  const pendingActions = [
    {
      title: 'Anamneses Pendentes',
      count: stats.pendingAnamneses || 0,
      icon: ClipboardList,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      description: 'Aguardando análise'
    },
    {
      title: 'Avaliações Físicas',
      count: stats.pendingAssessments || 0,
      icon: Activity,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      description: 'Para revisar'
    },
    {
      title: 'Feedbacks Pendentes',
      count: stats.pendingFeedbacks || 0,
      icon: Bell,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      description: 'Aguardando resposta'
    }
  ];

  if (loading) {
    return (
      <Layout title="Dashboard" userType="professional">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" userType="professional">
      <div data-testid="professional-dashboard" className="space-y-6">
        {/* Saudação */}
        {profile && (
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Olá, {profile.name?.split(' ')[0]}!</h2>
                <p className="text-teal-100 mt-1">Bem-vindo ao seu painel de controle</p>
              </div>
              {profile.role === 'admin' && (
                <Badge className="bg-yellow-400 text-yellow-900 border-0">
                  👑 Admin
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mainStats.map((stat, index) => (
            <Card 
              key={index} 
              className={`hover:shadow-lg transition-all cursor-pointer ${stat.bgLight} border-0`}
              onClick={stat.onClick}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.textColor}`}>
                      {stat.value}{stat.suffix || ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações Pendentes */}
        {(stats.pendingAnamneses > 0 || stats.pendingAssessments > 0 || stats.pendingFeedbacks > 0) && (
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Ações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pendingActions.filter(a => a.count > 0).map((action, idx) => (
                  <div key={idx} className={`${action.bg} rounded-lg p-4 flex items-center gap-3`}>
                    <action.icon className={`${action.color} h-8 w-8`} />
                    <div>
                      <p className="font-semibold text-gray-900">{action.count}</p>
                      <p className="text-sm text-gray-600">{action.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métricas de Planos por Tipo */}
        {stats.plansByType && stats.activePlans > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Distribuição de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <p className="text-3xl font-bold text-indigo-600">{stats.plansByType.general || 0}</p>
                  <p className="text-sm text-gray-600">Planos Gerais</p>
                  <p className="text-xs text-gray-400">Clássico, Fitness, etc</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <p className="text-3xl font-bold text-pink-600">{stats.plansByType.special || 0}</p>
                  <p className="text-sm text-gray-600">Planos Especiais</p>
                  <p className="text-xs text-gray-400">Por condição médica</p>
                </div>
                {stats.plansByType.specialBreakdown && Object.keys(stats.plansByType.specialBreakdown).length > 0 && (
                  <>
                    {Object.entries(stats.plansByType.specialBreakdown).slice(0, 2).map(([type, count]) => {
                      const typeLabels = {
                        diabetico: '🩸 Diabético',
                        hipertenso: '❤️ Hipertenso',
                        intolerancia: '🚫 Intolerância',
                        gestante: '🤰 Gestante',
                        lactante: '🤱 Lactante',
                        anemia: '🩺 Anemia',
                        renal: '🫘 Renal',
                        gastrite: '🔥 Gastrite',
                        colesterol: '🫀 Colesterol',
                        hipotireoidismo: '🦋 Tireoide'
                      };
                      return (
                        <div key={type} className="text-center p-4 bg-white rounded-xl shadow-sm">
                          <p className="text-2xl font-bold text-amber-600">{count}</p>
                          <p className="text-sm text-gray-600">{typeLabels[type] || type}</p>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Planos Alimentares Ativos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-green-600" />
                Planos Alimentares Ativos
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/professional/meal-plans')}
              >
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {stats.patientsWithActivePlans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="mx-auto mb-4 text-gray-300" size={40} />
                  <p>Nenhum plano ativo</p>
                  <p className="text-sm">Crie planos para seus pacientes</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {stats.patientsWithActivePlans.slice(0, 5).map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Utensils className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {plan.patient?.name || plan.name || 'Plano sem nome'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Atualizado: {new Date(plan.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewPlan(plan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pacientes Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Pacientes Recentes
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/professional/patients')}
              >
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto mb-4 text-gray-300" size={40} />
                  <p>Nenhum paciente cadastrado</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-teal-700"
                    onClick={() => navigate('/professional/patients')}
                  >
                    Cadastrar primeiro paciente →
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {stats.recentPatients.slice(0, 5).map((item) => {
                    const patient = item.patient || item;
                    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'P')}&background=0F766E&color=fff`;
                    return (
                      <div 
                        key={patient.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/professional/patient/${patient.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={patient.avatar_url || avatar} 
                            alt={patient.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{patient.name}</p>
                            <p className="text-xs text-gray-500">{patient.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.anamnesis_status === 'complete' ? (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Anamnese OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Atalhos Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/professional/patients')}
              >
                <Users className="h-6 w-6 text-teal-600" />
                <span className="text-sm">Novo Paciente</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/professional/meal-plans')}
              >
                <Utensils className="h-6 w-6 text-green-600" />
                <span className="text-sm">Criar Plano</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/professional/agenda')}
              >
                <Calendar className="h-6 w-6 text-blue-600" />
                <span className="text-sm">Ver Agenda</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/professional/foods')}
              >
                <Apple className="h-6 w-6 text-red-500" />
                <span className="text-sm">Alimentos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Visualização do Plano */}
      {selectedPlan && (
        <MealPlanViewerModal
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          mealPlan={selectedPlan}
          patient={selectedPlan.patient}
          onEdit={() => handleEditPlan(selectedPlan)}
        />
      )}
    </Layout>
  );
};

export default ProfessionalDashboard;
