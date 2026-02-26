import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, Loader2, Plus, Star, Send, 
  CheckCircle, Clock, ChevronRight, Smile, Frown, Meh
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientFeedbacks, createFeedback } from '@/lib/supabase';
import { toast } from 'sonner';

const PatientFeedbacks = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [newFeedback, setNewFeedback] = useState({
    feedback_type: 'general',
    rating: 0,
    comment: '',
    symptoms: []
  });

  useEffect(() => {
    if (user) loadFeedbacks();
  }, [user]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPatientFeedbacks(user.id);
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast.error('Erro ao carregar feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!newFeedback.comment.trim()) {
      toast.error('Por favor, escreva seu feedback');
      return;
    }
    
    try {
      const feedbackData = {
        patient_id: user.id,
        professional_id: profile?.professional_id || null,
        feedback_type: newFeedback.feedback_type,
        rating: newFeedback.rating || null,
        comment: newFeedback.comment,
        symptoms: newFeedback.symptoms
      };
      
      const { error } = await createFeedback(feedbackData);
      if (error) throw error;
      
      toast.success('Feedback enviado com sucesso!');
      setShowAddModal(false);
      setNewFeedback({ feedback_type: 'general', rating: 0, comment: '', symptoms: [] });
      loadFeedbacks();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Erro ao enviar feedback');
    }
  };

  const feedbackTypes = [
    { value: 'general', label: 'Geral', icon: MessageSquare },
    { value: 'meal', label: 'Sobre uma refeição', icon: Smile },
    { value: 'supplement', label: 'Sobre suplementos', icon: Meh },
    { value: 'weight', label: 'Sobre meu peso', icon: Frown },
    { value: 'mood', label: 'Bem-estar', icon: Smile }
  ];

  const symptomOptions = [
    'Mais energia', 'Menos energia', 'Boa disposição', 'Cansaço',
    'Satisfeito com as refeições', 'Com fome', 'Náusea', 'Desconforto abdominal',
    'Dormindo bem', 'Insônia', 'Motivado(a)', 'Desanimado(a)'
  ];

  const toggleSymptom = (symptom) => {
    setNewFeedback(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const getTypeLabel = (type) => {
    const found = feedbackTypes.find(t => t.value === type);
    return found?.label || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-700',
      'meal': 'bg-green-100 text-green-700',
      'supplement': 'bg-blue-100 text-blue-700',
      'weight': 'bg-purple-100 text-purple-700',
      'mood': 'bg-yellow-100 text-yellow-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Layout title="Meus Feedbacks" userType="patient">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  // Visualização detalhada
  if (selectedFeedback) {
    return (
      <Layout title="Meus Feedbacks" userType="patient">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedFeedback(null)}
            className="mb-4"
          >
            ← Voltar para feedbacks
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedFeedback.feedback_type)}`}>
                  {getTypeLabel(selectedFeedback.feedback_type)}
                </span>
                {selectedFeedback.professional_response ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle size={16} />
                    Respondido
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 text-sm">
                    <Clock size={16} />
                    Aguardando resposta
                  </span>
                )}
              </div>
              <CardDescription>
                Enviado em {new Date(selectedFeedback.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedFeedback.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Avaliação:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={20}
                        className={star <= selectedFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.comment}</p>
              </div>
              
              {selectedFeedback.symptoms?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Como você estava se sentindo:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.symptoms.map((symptom, index) => (
                      <span key={index} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedFeedback.professional_response && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Resposta do nutricionista:</p>
                  <div className="p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
                    <p className="text-gray-700">{selectedFeedback.professional_response}</p>
                  </div>
                  {selectedFeedback.responded_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Respondido em {new Date(selectedFeedback.responded_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Meus Feedbacks" userType="patient">
      <div className="space-y-6">
        {/* Botão de novo feedback */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="w-full bg-teal-700 hover:bg-teal-800" size="lg">
              <Plus className="mr-2" size={20} />
              Enviar Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Feedback</DialogTitle>
              <DialogDescription>
                Compartilhe como está sendo sua experiência
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Tipo de feedback</Label>
                <Select 
                  value={newFeedback.feedback_type} 
                  onValueChange={(v) => setNewFeedback({ ...newFeedback, feedback_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feedbackTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Como você avalia sua experiência?</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        size={32}
                        className={star <= newFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Como você está se sentindo? (opcional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {symptomOptions.map(symptom => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        newFeedback.symptoms.includes(symptom)
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Seu feedback</Label>
                <Textarea
                  value={newFeedback.comment}
                  onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                  placeholder="Conte como está sendo sua experiência, dúvidas, sugestões..."
                  rows={4}
                />
              </div>
              
              <Button onClick={handleSubmitFeedback} className="w-full bg-teal-700">
                <Send className="mr-2" size={16} />
                Enviar Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lista de feedbacks */}
        {feedbacks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum feedback enviado
              </h3>
              <p className="text-gray-600">
                Envie seu primeiro feedback para seu nutricionista!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {feedbacks.map(feedback => (
              <Card 
                key={feedback.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedFeedback(feedback)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(feedback.feedback_type)}`}>
                          {getTypeLabel(feedback.feedback_type)}
                        </span>
                        {feedback.rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                size={14}
                                className={star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        )}
                        {feedback.professional_response ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle size={12} />
                            Respondido
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-xs">
                            <Clock size={12} />
                            Pendente
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 line-clamp-2">{feedback.comment}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <ChevronRight className="text-gray-400 flex-shrink-0" />
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

export default PatientFeedbacks;
