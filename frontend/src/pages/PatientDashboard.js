import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Droplet, Footprints, Dumbbell, AlertTriangle } from 'lucide-react';
import { anamnesisAlerts, mockPatients } from '@/data/mockData';

const PatientDashboard = () => {
  const patientName = localStorage.getItem('fitjourney_patient_name') || 'Paciente';
  const patientId = localStorage.getItem('fitjourney_patient_id');
  const patient = mockPatients.find(p => p.id === parseInt(patientId));
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

  return (
    <Layout title="Meu Dashboard" userType="patient">
      <div data-testid="patient-dashboard" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Peso Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">72 kg</p>
              <p className="text-sm text-green-600 mt-1">↓ 2kg este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">65 kg</p>
              <p className="text-sm text-gray-600 mt-1">Faltam 7kg</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-700">22%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-teal-700 h-2 rounded-full" style={{ width: '22%' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 text-amber-600" size={20} />
              Alertas da Anamnese
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anamnesisAlerts.slice(0, 2).map((alert, index) => (
                <div key={index} className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                  <p className="font-semibold text-amber-900">{alert.condition}</p>
                  <p className="text-sm text-amber-700 mt-1">{alert.alert}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientDashboard;
