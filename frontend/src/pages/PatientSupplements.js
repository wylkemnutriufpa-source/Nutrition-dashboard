import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Loader2, Clock, Calendar, AlertCircle, Info, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientSupplements } from '@/lib/supabase';
import { toast } from 'sonner';

const PatientSupplements = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [supplements, setSupplements] = useState([]);

  useEffect(() => {
    if (user) loadSupplements();
  }, [user]);

  const loadSupplements = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPatientSupplements(user.id);
      if (error) throw error;
      setSupplements(data || []);
    } catch (error) {
      console.error('Error loading supplements:', error);
      toast.error('Erro ao carregar suplementos');
    } finally {
      setLoading(false);
    }
  };

  const getTimeIcon = (time) => {
    const icons = {
      'manhã': Sunrise,
      'tarde': Sun,
      'noite': Moon,
      'antes das refeições': Sunset
    };
    return icons[time?.toLowerCase()] || Clock;
  };

  const getTimeColor = (time) => {
    const colors = {
      'manhã': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'tarde': 'bg-orange-100 text-orange-700 border-orange-200',
      'noite': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'antes das refeições': 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[time?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Agrupar por horário
  const groupedSupplements = supplements.reduce((acc, supp) => {
    const time = supp.time_of_day || 'Sem horário';
    if (!acc[time]) acc[time] = [];
    acc[time].push(supp);
    return acc;
  }, {});

  const timeOrder = ['manhã', 'tarde', 'noite', 'antes das refeições', 'Sem horário'];
  const sortedTimes = Object.keys(groupedSupplements).sort(
    (a, b) => timeOrder.indexOf(a.toLowerCase()) - timeOrder.indexOf(b.toLowerCase())
  );

  if (loading) {
    return (
      <Layout title="Suplementos" userType="patient">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  if (supplements.length === 0) {
    return (
      <Layout title="Suplementos" userType="patient">
        <Card className="text-center py-12">
          <CardContent>
            <Pill className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum suplemento prescrito
            </h3>
            <p className="text-gray-600">
              Seu nutricionista ainda não prescreveu suplementos para você.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Suplementos" userType="patient">
      <div className="space-y-6">
        {/* Aviso importante */}
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-800">Importante</p>
              <p className="text-sm text-amber-700">
                Siga as orientações de dosagem e horário recomendadas pelo seu nutricionista.
                Em caso de dúvidas, entre em contato antes de fazer alterações.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Suplementos agrupados por horário */}
        {sortedTimes.map(time => {
          const TimeIcon = getTimeIcon(time);
          const colorClass = getTimeColor(time);
          
          return (
            <div key={time} className="space-y-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${colorClass}`}>
                <TimeIcon size={18} />
                <span className="font-semibold capitalize">{time}</span>
                <span className="text-sm">({groupedSupplements[time].length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedSupplements[time].map(supp => (
                  <Card key={supp.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-teal-100 rounded-full">
                          <Pill className="text-teal-700" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{supp.name}</h3>
                          {supp.brand && (
                            <p className="text-sm text-gray-500">{supp.brand}</p>
                          )}
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                              <span className="font-medium text-teal-700">{supp.dosage}</span>
                              <span className="text-gray-400">•</span>
                              <span>{supp.frequency}</span>
                            </div>
                            
                            {supp.instructions && (
                              <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                <Info size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600">{supp.instructions}</p>
                              </div>
                            )}
                            
                            {supp.purpose && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Para:</span> {supp.purpose}
                              </p>
                            )}
                            
                            {(supp.start_date || supp.end_date) && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar size={14} />
                                {supp.start_date && (
                                  <span>Início: {new Date(supp.start_date).toLocaleDateString('pt-BR')}</span>
                                )}
                                {supp.end_date && (
                                  <>
                                    <span className="text-gray-300">→</span>
                                    <span>Até: {new Date(supp.end_date).toLocaleDateString('pt-BR')}</span>
                                  </>
                                )}
                                {!supp.end_date && supp.start_date && (
                                  <span className="text-green-600">(uso contínuo)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default PatientSupplements;
