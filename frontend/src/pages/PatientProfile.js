import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { mockPatients, anamnesisAlerts } from '@/data/mockData';
import { Calendar, FileText, Utensils, AlertTriangle } from 'lucide-react';

const PatientProfile = () => {
  const { id } = useParams();
  const patient = mockPatients.find(p => p.id === parseInt(id));

  if (!patient) return <div>Paciente não encontrado</div>;

  return (
    <Layout title={patient.name} showBack userType="professional">
      <div data-testid="patient-profile" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <img src={patient.avatar} alt={patient.name} className="w-24 h-24 rounded-full" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                <p className="text-gray-600">{patient.email}</p>
                <p className="text-gray-600">{patient.phone}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  patient.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {patient.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Idade</p>
                <p className="text-2xl font-bold text-gray-900">{patient.age} anos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            <TabsTrigger value="plano">Plano Alimentar</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Peso Atual</p>
                    <p className="text-lg font-semibold">72 kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Altura</p>
                    <p className="text-lg font-semibold">1.65 m</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IMC</p>
                    <p className="text-lg font-semibold">26.4</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Objetivo</p>
                    <p className="text-lg font-semibold">Perda de peso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anamnese" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 text-amber-600" size={20} />
                  Alertas da Anamnese
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anamnesisAlerts.map((alert, index) => (
                    <div key={index} className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                      <p className="font-semibold text-amber-900">{alert.condition}</p>
                      <p className="text-sm text-amber-700 mt-1">{alert.alert}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plano" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Plano Alimentar Ativo</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="bg-teal-700 hover:bg-teal-800" onClick={() => window.location.href = '/professional/meal-plan-editor'}>
                  <Utensils className="mr-2" size={18} />
                  Criar/Editar Plano Alimentar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardContent className="py-8 text-center text-gray-600">
                Templates de planos (Mock)
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedbacks">
            <Card>
              <CardContent className="py-8 text-center text-gray-600">
                Feedbacks do paciente (Mock)
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arquivos">
            <Card>
              <CardContent className="py-8 text-center text-gray-600">
                Arquivos anexos (Mock)
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PatientProfile;