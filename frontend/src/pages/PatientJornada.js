import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PatientJornada = () => {
  const { user } = useAuth();
  const [programData, setProgramData] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);

  // Mock data - será substituído por dados reais do Supabase
  useEffect(() => {
    // Simular carregamento de dados
    setProgramData({
      startDate: '2024-01-01',
      endDate: '2024-04-01',
      programType: 'Trimestral',
      daysRemaining: 45
    });

    setWeightHistory([
      { date: '2024-01-01', weight: 75 },
      { date: '2024-01-15', weight: 73.5 },
      { date: '2024-02-01', weight: 71.8 },
      { date: '2024-02-15', weight: 70.2 }
    ]);
  }, []);

  const daysCompleted = programData ? 
    Math.floor((new Date() - new Date(programData.startDate)) / (1000 * 60 * 60 * 24)) : 0;
  
  const totalDays = programData ?
    Math.floor((new Date(programData.endDate) - new Date(programData.startDate)) / (1000 * 60 * 60 * 24)) : 90;

  const progressPercentage = Math.min((daysCompleted / totalDays) * 100, 100);

  return (
    <Layout title="Minha Jornada" userType="patient">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com Info do Programa */}
        <Card className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm opacity-90 mb-1">Programa</p>
                <p className="text-2xl font-bold">{programData?.programType || 'Carregando...'}</p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Início</p>
                <p className="text-xl font-semibold">
                  {programData ? new Date(programData.startDate).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Término</p>
                <p className="text-xl font-semibold">
                  {programData ? new Date(programData.endDate).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Dias Restantes</p>
                <p className="text-2xl font-bold">{programData?.daysRemaining || '-'}</p>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso do Programa</span>
                <span className="font-bold">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <div 
                  className="bg-white rounded-full h-4 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Peso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 text-teal-600" size={24} />
              Histórico de Peso
            </CardTitle>
            <CardDescription>Sua evolução desde o início do programa</CardDescription>
          </CardHeader>
          <CardContent>
            {weightHistory.length > 0 ? (
              <div>
                {/* Gráfico simples com divs (depois pode usar biblioteca) */}
                <div className="space-y-3">
                  {weightHistory.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-24">
                        {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div 
                          className="bg-gradient-to-r from-teal-500 to-green-500 rounded-full h-8 flex items-center justify-end pr-3"
                          style={{ width: `${(entry.weight / Math.max(...weightHistory.map(e => e.weight))) * 100}%` }}
                        >
                          <span className="text-white font-bold text-sm">{entry.weight} kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-gray-600">Peso Inicial</p>
                      <p className="text-2xl font-bold text-blue-700">{weightHistory[0]?.weight} kg</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-gray-600">Peso Atual</p>
                      <p className="text-2xl font-bold text-green-700">
                        {weightHistory[weightHistory.length - 1]?.weight} kg
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-gray-600">Perdido</p>
                      <p className="text-2xl font-bold text-purple-700">
                        -{(weightHistory[0]?.weight - weightHistory[weightHistory.length - 1]?.weight).toFixed(1)} kg
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 font-medium">Nenhum histórico ainda</p>
                <p className="text-sm text-gray-500">Seu nutricionista adicionará suas pesagens</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fotos de Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 text-teal-600" size={24} />
              Fotos de Progresso
            </CardTitle>
            <CardDescription>Comparativo visual da sua transformação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Award className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-2">Funcionalidade em Desenvolvimento</p>
              <p className="text-sm text-gray-500">
                Em breve você verá comparativos antes/depois automaticamente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientJornada;
