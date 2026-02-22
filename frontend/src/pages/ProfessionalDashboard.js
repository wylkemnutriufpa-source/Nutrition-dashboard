import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, CheckSquare, TrendingUp } from 'lucide-react';
import { mockPatients } from '@/data/mockData';

const ProfessionalDashboard = () => {
  const activePatients = mockPatients.filter(p => p.status === 'Ativo').length;
  const totalPatients = mockPatients.length;
  const activePlans = 8;
  const pendingTasks = 5;

  const stats = [
    { title: 'Pacientes Ativos', value: activePatients, icon: Users, color: 'bg-teal-700', total: totalPatients },
    { title: 'Planos Ativos', value: activePlans, icon: Calendar, color: 'bg-green-600' },
    { title: 'Tarefas Pendentes', value: pendingTasks, icon: CheckSquare, color: 'bg-blue-600' },
    { title: 'Taxa de Adesão', value: '87%', icon: TrendingUp, color: 'bg-purple-600' }
  ];

  return (
    <Layout title="Dashboard" userType="professional">
      <div data-testid="professional-dashboard" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
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
                  {stat.total && <span className="text-lg text-gray-500 ml-1">/ {stat.total}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consultas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPatients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <img src={patient.avatar} alt={patient.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-semibold text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">Última consulta: {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    patient.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {patient.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;