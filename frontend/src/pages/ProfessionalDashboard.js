import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, TrendingUp, Loader2, Utensils, Eye, Edit, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfessionalStats } from '@/lib/supabase';
import { toast } from 'sonner';

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePatients: 0,
    totalPatients: 0,
    activePlans: 0,
    recentPatients: []
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
      const data = await getProfessionalStats(user.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Pacientes Ativos', 
      value: stats.activePatients, 
      icon: Users, 
      color: 'bg-teal-700', 
      total: stats.totalPatients 
    },
    { 
      title: 'Planos Ativos', 
      value: stats.activePlans, 
      icon: Calendar, 
      color: 'bg-green-600' 
    },
    { 
      title: 'Taxa de Adesão', 
      value: stats.totalPatients > 0 ? Math.round((stats.activePlans / stats.totalPatients) * 100) + '%' : '0%', 
      icon: TrendingUp, 
      color: 'bg-purple-600' 
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
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold">Olá, {profile.name?.split(' ')[0]}!</h2>
            <p className="text-teal-100 mt-1">Bem-vindo ao seu painel de controle</p>
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="text-white" size={20} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stat.value}
                  {stat.total !== undefined && <span className="text-lg text-gray-500 ml-1">/ {stat.total}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pacientes Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pacientes Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Nenhum paciente cadastrado ainda</p>
                <button 
                  onClick={() => navigate('/professional/patients')}
                  className="mt-4 text-teal-700 hover:text-teal-800 font-medium"
                >
                  Cadastrar primeiro paciente →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentPatients.map((item) => {
                  const patient = item.patient;
                  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0F766E&color=fff`;
                  return (
                    <div 
                      key={patient.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/professional/patient/${patient.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <img src={avatar} alt={patient.name} className="w-12 h-12 rounded-full" />
                        <div>
                          <p className="font-semibold text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">
                            Cadastro: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-teal-700"
            onClick={() => navigate('/professional/patients')}
          >
            <CardContent className="p-6 flex items-center space-x-4">
              <Users className="text-teal-700" size={32} />
              <div>
                <h3 className="font-semibold text-gray-900">Gerenciar Pacientes</h3>
                <p className="text-sm text-gray-600">Ver lista completa de pacientes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-600"
            onClick={() => navigate('/professional/food-database')}
          >
            <CardContent className="p-6 flex items-center space-x-4">
              <Calendar className="text-green-600" size={32} />
              <div>
                <h3 className="font-semibold text-gray-900">Banco de Alimentos</h3>
                <p className="text-sm text-gray-600">Gerenciar alimentos customizados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;
