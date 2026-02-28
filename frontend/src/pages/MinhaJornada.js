import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Flame, Trophy, Target, Calendar, MessageSquare, Lightbulb,
  CheckCircle2, Circle, Sparkles, TrendingUp, Clock, Star,
  Send, ChevronRight, Zap, Heart, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getChecklistTasks, toggleChecklistTask, createChecklistTask,
  getPatientPersonalizedTips, getPatientAppointments, 
  getPatientFeedbacks, sendFeedbackReply, getPatientStats
} from '@/lib/supabase';

// Sugestões de hábitos saudáveis
const DEFAULT_HABITS = [
  { title: '💧 Beber 2L de água', icon: '💧' },
  { title: '😴 Dormir 7-8 horas', icon: '😴' },
  { title: '🏃 Exercício físico (30 min)', icon: '🏃' },
  { title: '🥗 Comer 3 porções de vegetais', icon: '🥗' },
  { title: '🍎 Comer 2 frutas', icon: '🍎' },
  { title: '🚫 Evitar açúcar refinado', icon: '🚫' },
  { title: '⏰ Respeitar horário das refeições', icon: '⏰' },
  { title: '🧘 10 min de relaxamento', icon: '🧘' },
  { title: '📝 Registrar peso/medidas', icon: '📝' },
  { title: '🚶 Caminhar 10 mil passos', icon: '🚶' }
];

const MinhaJornada = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tips, setTips] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [patientStats, setPatientStats] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (user?.id) loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [tasksRes, tipsRes, appointmentsRes, feedbacksRes, statsRes] = await Promise.all([
        getChecklistTasks(user.id),
        getPatientPersonalizedTips(user.id),
        getPatientAppointments(user.id),
        getPatientFeedbacks(user.id),
        getPatientStats(user.id)
      ]);

      setTasks(tasksRes.data || []);
      setTips(tipsRes.data || []);
      setPatientStats(statsRes);
      
      // Próximo compromisso
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = (appointmentsRes.data || [])
        .filter(a => new Date(a.date + 'T00:00:00') >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setNextAppointment(upcoming[0] || null);
      
      // Feedbacks não respondidos
      setFeedbacks((feedbacksRes.data || []).slice(0, 3));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, completed) => {
    try {
      await toggleChecklistTask(taskId, !completed);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !completed } : t));
      if (!completed) {
        toast.success('🎉 Ótimo trabalho!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleAddDefaultHabits = async () => {
    const existingTitles = tasks.map(t => t.title);
    const newHabits = DEFAULT_HABITS.filter(h => !existingTitles.includes(h.title));
    
    for (const habit of newHabits) {
      try {
        const { data } = await createChecklistTask(user.id, habit.title);
        if (data) setTasks(prev => [...prev, data]);
      } catch (e) {}
    }
    toast.success(`${newHabits.length} hábitos adicionados!`);
  };

  const handleOpenFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyText('');
    setShowFeedbackModal(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedFeedback) return;
    
    setSendingReply(true);
    try {
      await sendFeedbackReply(selectedFeedback.id, replyText);
      toast.success('Resposta enviada!');
      setShowFeedbackModal(false);
      loadAllData();
    } catch (error) {
      toast.error('Erro ao enviar resposta');
    } finally {
      setSendingReply(false);
    }
  };

  // Cálculos de progresso
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Mensagem motivacional
  const getMotivation = () => {
    if (progressPercent === 100) return { text: '🏆 Dia perfeito! Você é incrível!', color: 'text-green-600', bg: 'bg-green-50' };
    if (progressPercent >= 75) return { text: '🔥 Quase lá! Continue assim!', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (progressPercent >= 50) return { text: '💪 Bom progresso! Você consegue!', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (progressPercent >= 25) return { text: '🌱 Bom começo! Cada passo conta!', color: 'text-teal-600', bg: 'bg-teal-50' };
    return { text: '✨ Comece sua jornada de hoje!', color: 'text-purple-600', bg: 'bg-purple-50' };
  };

  const motivation = getMotivation();

  // Meta do paciente
  const patientGoal = patientStats?.profile?.goal_weight 
    ? `Meta: ${patientStats.profile.goal_weight}kg` 
    : 'Configure sua meta';

  if (loading) {
    return (
      <Layout title="Minha Jornada" userType="patient">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Minha Jornada" userType="patient">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        
        {/* ========== BLOCO SUPERIOR - PROGRESSO DO DIA ========== */}
        <Card className={`${motivation.bg} border-0 shadow-lg overflow-hidden`}>
          <CardContent className="pt-6 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Olá, {profile?.name?.split(' ')[0] || 'Paciente'}! 👋
                </h2>
                <p className={`text-lg font-medium mt-1 ${motivation.color}`}>
                  {motivation.text}
                </p>
              </div>
              {progressPercent === 100 && (
                <div className="bg-yellow-400 p-4 rounded-full animate-pulse">
                  <Trophy className="h-8 w-8 text-yellow-900" />
                </div>
              )}
            </div>

            {/* Progresso Circular */}
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={progressPercent === 100 ? '#10B981' : progressPercent >= 50 ? '#F59E0B' : '#6366F1'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(progressPercent / 100) * 352} 352`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{progressPercent}%</span>
                  <span className="text-xs text-gray-500">Concluído</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/80 rounded-xl">
                    <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
                    <p className="text-xs text-gray-500">Tarefas feitas</p>
                  </div>
                  <div className="text-center p-3 bg-white/80 rounded-xl">
                    <Target className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                    <p className="text-xs text-gray-500">Total do dia</p>
                  </div>
                  <div className="text-center p-3 bg-white/80 rounded-xl">
                    <Award className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{patientGoal}</p>
                    <p className="text-xs text-gray-500">Sua meta</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========== CHECKLIST DIÁRIO (DESTAQUE PRINCIPAL) ========== */}
        <Card className="border-2 border-teal-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-6 w-6" />
                Checklist do Dia
              </CardTitle>
              <Badge className="bg-white/20 text-white border-0">
                {completedTasks}/{totalTasks}
              </Badge>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2 mt-3 bg-white/20" 
            />
          </CardHeader>
          <CardContent className="p-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhum hábito configurado ainda</p>
                <Button onClick={handleAddDefaultHabits} className="bg-teal-600 hover:bg-teal-700">
                  <Zap className="mr-2 h-4 w-4" />
                  Adicionar Hábitos Saudáveis
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${task.completed 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-white border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                      }
                    `}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                      {task.title}
                    </span>
                    {task.completed && (
                      <Badge className="bg-green-100 text-green-700 border-0">✓</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tasks.length > 0 && tasks.length < 10 && (
              <Button 
                variant="outline" 
                className="w-full mt-4 border-dashed"
                onClick={handleAddDefaultHabits}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Adicionar mais hábitos sugeridos
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ========== FEEDBACKS DO PROFISSIONAL ========== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Feedbacks do Nutricionista
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">Nenhum feedback recente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((feedback) => (
                    <div 
                      key={feedback.id}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleOpenFeedback(feedback)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 line-clamp-2">
                            {feedback.message || feedback.content}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-blue-400" />
                      </div>
                      {!feedback.patient_response && (
                        <Badge className="mt-2 bg-blue-200 text-blue-700 border-0 text-xs">
                          Aguardando resposta
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========== PRÓXIMO COMPROMISSO ========== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-purple-600" />
                Próximo Compromisso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextAppointment ? (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-purple-900">{nextAppointment.title}</p>
                      <p className="text-sm text-purple-700">
                        {new Date(nextAppointment.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long'
                        })}
                      </p>
                      {nextAppointment.time && (
                        <p className="text-sm text-purple-600 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {nextAppointment.time}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">Nenhum compromisso agendado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ========== DICA DO DIA ========== */}
        {tips.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Dica do Dia
                  </h3>
                  <p className="text-amber-800 mt-2">
                    {tips[0]?.tip || tips[0]?.title || 'Mantenha-se hidratado ao longo do dia!'}
                  </p>
                  {tips[0]?.source === 'assessment' && (
                    <Badge className="mt-2 bg-purple-100 text-purple-700 border-0">
                      Baseada na sua avaliação física
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== META ATUAL ========== */}
        {patientStats?.profile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-green-600" />
                Minha Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">Peso atual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patientStats.profile.current_weight || '--'} kg
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="text-right">
                  <p className="text-sm text-gray-600">Meta</p>
                  <p className="text-2xl font-bold text-green-600">
                    {patientStats.profile.goal_weight || '--'} kg
                  </p>
                </div>
              </div>
              {patientStats.profile.current_weight && patientStats.profile.goal_weight && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>
                      {Math.abs(patientStats.profile.current_weight - patientStats.profile.goal_weight).toFixed(1)} kg restantes
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, 
                      100 - ((patientStats.profile.current_weight - patientStats.profile.goal_weight) / 
                      (patientStats.profile.initial_weight || patientStats.profile.current_weight - patientStats.profile.goal_weight)) * 100
                    ))} 
                    className="h-3"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========== MODAL DE FEEDBACK ========== */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Feedback do Nutricionista
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {new Date(selectedFeedback.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-gray-800">{selectedFeedback.message || selectedFeedback.content}</p>
              </div>
              
              {selectedFeedback.patient_response ? (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Sua resposta:</p>
                  <p className="text-gray-800">{selectedFeedback.patient_response}</p>
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Escreva sua resposta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendReply} 
                    disabled={sendingReply || !replyText.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendingReply ? 'Enviando...' : 'Enviar Resposta'}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MinhaJornada;
