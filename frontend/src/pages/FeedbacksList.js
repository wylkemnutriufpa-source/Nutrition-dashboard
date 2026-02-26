import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FeedbacksList = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Buscar todas as mensagens enviadas por pacientes
      const { data, error } = await supabase
        .from('patient_messages')
        .select(`
          *,
          patient:profiles!patient_id(id, name, email)
        `)
        .eq('sender', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedbacks(data || []);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      toast.error('Erro ao carregar feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood) => {
    const moods = {
      great: '😊',
      good: '🙂',
      ok: '😐',
      bad: '😟',
      terrible: '😞'
    };
    return moods[mood] || '😐';
  };

  const getMoodLabel = (mood) => {
    const labels = {
      great: 'Ótimo',
      good: 'Bom',
      ok: 'Ok',
      bad: 'Ruim',
      terrible: 'Péssimo'
    };
    return labels[mood] || 'Sem humor';
  };

  if (loading) {
    return (
      <Layout title="Feedbacks dos Pacientes" showBack userType="professional">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-teal-700" size={48} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Feedbacks dos Pacientes" showBack userType="professional">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="text-teal-700" size={24} />
                <div>
                  <CardTitle>Todos os Feedbacks</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {feedbacks.length} feedback(s) recebido(s)
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {feedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum feedback recebido ainda</p>
                <p className="text-sm mt-2">
                  Os feedbacks dos seus pacientes aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {feedbacks.map((feedback) => (
              <Card
                key={feedback.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/professional/patients/${feedback.patient_id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <User className="text-teal-700" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {feedback.patient?.name || 'Paciente'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar size={14} />
                            {format(new Date(feedback.created_at), "dd 'de' MMMM 'às' HH:mm", {
                              locale: ptBR
                            })}
                          </div>
                        </div>
                      </div>

                      {feedback.mood && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getMoodEmoji(feedback.mood)}</span>
                          <span className="text-sm font-medium text-gray-700">
                            Humor: {getMoodLabel(feedback.mood)}
                          </span>
                        </div>
                      )}

                      {feedback.message && (
                        <p className="text-gray-700 mb-2 line-clamp-2">{feedback.message}</p>
                      )}

                      {feedback.type && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                          {feedback.type}
                        </span>
                      )}
                    </div>

                    <Button variant="ghost" size="sm">
                      <ArrowRight size={20} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FeedbacksList;
