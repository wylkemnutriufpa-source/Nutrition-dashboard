import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, UserX, TrendingUp, DollarSign, FileText,
  Plus, MessageSquare, ClipboardList, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfessionalDashboard } from '@/hooks/useProfessionalDashboard';
import MetricCard from '@/components/dashboard/MetricCard';
import AttentionAlert from '@/components/dashboard/AttentionAlert';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import SimpleEngagementChart from '@/components/dashboard/SimpleEngagementChart';
import PatientEngagementBadge from '@/components/dashboard/PatientEngagementBadge';
import { formatCurrency } from '@/utils/professionalIntelligence';

const ProfessionalDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Hook centralizado com TODOS os dados
  const {
    loading,
    error,
    metrics,
    attentionAlerts,
    patientsWithScore,
    chartData,
    refresh
  } = useProfessionalDashboard(profile?.id);

  // Handlers de ações rápidas
  const handleQuickAction = (action) => {
    switch (action) {
      case 'createPlan':
        navigate('/professional/patients');
        toast.info('Selecione um paciente para criar o plano');
        break;
      case 'sendFeedback':
        navigate('/professional/feedbacks');
        break;
      case 'createChecklist':
        navigate('/professional/patients');
        toast.info('Selecione um paciente para configurar checklist');
        break;
      case 'duplicatePlan':
        navigate('/professional/patients');
        toast.info('Selecione um paciente com plano para duplicar');
        break;
      case 'viewReports':
        toast.info('Relatórios em breve!');
        break;
      default:
        break;
    }
  };

  // Handler de alertas
  const handleAlertAction = (action, patientId) => {
    switch (action) {
      case 'sendReminder':
        toast.success('Lembrete enviado!');
        break;
      case 'sendFeedback':
        navigate(`/professional/patient/${patientId}?tab=feedbacks`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard" userType="professional">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando insights...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard" userType="professional">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-700">Erro ao carregar dashboard: {error}</p>
            <Button onClick={refresh} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Profissional" userType="professional">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        
        {/* ========== HEADER COM BOAS-VINDAS ========== */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Olá, {profile?.name?.split(' ')[0] || 'Profissional'}! 👋
              </h1>
              <p className="text-teal-100">
                Aqui está um resumo dos seus atendimentos hoje
              </p>
            </div>
            <Button
              onClick={refresh}
              variant="outline"
              className="bg-white text-teal-700 hover:bg-teal-50 border-0"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* ========== SEÇÃO 1: VISÃO EXECUTIVA (Cards de Métricas) ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Pacientes Ativos"
            value={metrics.activePatients}
            subtitle="Últimos 7 dias"
            icon={Users}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          
          <MetricCard
            title="Pacientes Inativos"
            value={metrics.inactivePatients}
            subtitle="7+ dias sem login"
            icon={UserX}
            iconColor="text-red-600"
            iconBg="bg-red-100"
          />
          
          <MetricCard
            title="Engajamento Médio"
            value={`${metrics.avgEngagement}%`}
            subtitle="Checklist concluído"
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          
          <MetricCard
            title="Faturamento"
            value={formatCurrency(metrics.revenue)}
            subtitle="Estimativa mensal"
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
          />
          
          <MetricCard
            title="Planos Ativos"
            value={metrics.activePlans}
            subtitle="Alimentares vigentes"
            icon={FileText}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
        </div>

        {/* ========== SEÇÃO 2: ATENÇÃO HOJE (Alertas Inteligentes) ========== */}
        <AttentionAlert 
          alerts={attentionAlerts} 
          onAction={handleAlertAction}
        />

        {/* ========== SEÇÃO 3: AÇÕES RÁPIDAS ========== */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Ações Rápidas
            </h3>
            <QuickActionsGrid onAction={handleQuickAction} />
          </CardContent>
        </Card>

        {/* ========== SEÇÃO 4: GRÁFICO + PACIENTES ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Mini Gráfico */}
          <div className="lg:col-span-1">
            <SimpleEngagementChart 
              data={chartData}
              title="Adesão ao Checklist (7 dias)"
            />
          </div>

          {/* Lista de Pacientes com Score */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Seus Pacientes ({patientsWithScore.length})
                </h3>

                {patientsWithScore.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum paciente cadastrado ainda</p>
                    <Button
                      onClick={() => navigate('/professional/patients')}
                      className="mt-4 bg-teal-600 hover:bg-teal-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Paciente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {patientsWithScore
                      .sort((a, b) => a.engagementScore - b.engagementScore) // Risco primeiro
                      .slice(0, 10) // Top 10
                      .map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => navigate(`/professional/patient/${patient.id}`)}
                          className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer bg-white"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {patient.name}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">
                              {patient.email}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                {patient.engagementScore}
                              </div>
                              <div className="text-xs text-gray-500">score</div>
                            </div>
                            <PatientEngagementBadge
                              score={patient.engagementScore}
                              classification={patient.classification}
                              size="md"
                            />
                          </div>
                        </div>
                      ))}

                    {patientsWithScore.length > 10 && (
                      <Button
                        onClick={() => navigate('/professional/patients')}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        Ver Todos os Pacientes ({patientsWithScore.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;
