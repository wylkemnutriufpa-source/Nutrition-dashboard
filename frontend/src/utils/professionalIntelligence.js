/**
 * Dashboard Profissional Inteligente
 * Lógica de cálculo de métricas, scores e alertas
 */

// ==================== SCORE DE ENGAJAMENTO ====================

/**
 * Calcula score de engajamento do paciente (0-100)
 * @param {Object} patient - Dados do paciente
 * @param {Object} stats - Estatísticas agregadas
 * @returns {number} Score 0-100
 */
export const calculatePatientEngagementScore = (patient, stats = {}) => {
  let score = 0;

  // 1. Checklist (40 pontos) - Últimos 7 dias
  const checklistCompletion = stats.checklist_completion_7d || 0;
  score += (checklistCompletion / 100) * 40;

  // 2. Atualização de Peso (20 pontos) - Últimos 14 dias
  if (stats.last_weight_update) {
    const daysSinceUpdate = Math.floor(
      (new Date() - new Date(stats.last_weight_update)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate <= 7) score += 20;
    else if (daysSinceUpdate <= 14) score += 15;
    else if (daysSinceUpdate <= 30) score += 10;
    else score += 0;
  } else {
    score += 5; // Tem peso inicial
  }

  // 3. Feedback (20 pontos) - Respondidos nos últimos 7 dias
  const feedbackScore = Math.min((stats.responded_feedbacks_7d || 0) * 10, 20);
  score += feedbackScore;

  // 4. Presença na Agenda (20 pontos)
  const appointmentScore = stats.has_upcoming_appointment ? 20 : 5;
  score += appointmentScore;

  return Math.round(Math.min(score, 100));
};

/**
 * Classifica nível de engajamento
 * @param {number} score - Score 0-100
 * @returns {Object} Classificação com cor, ícone e label
 */
export const classifyEngagement = (score) => {
  if (score >= 80) {
    return {
      level: 'high',
      color: 'bg-green-100 text-green-700 border-green-300',
      dotColor: 'bg-green-500',
      icon: '🟢',
      label: 'Engajado',
      textColor: 'text-green-700'
    };
  }
  if (score >= 50) {
    return {
      level: 'medium',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      dotColor: 'bg-yellow-500',
      icon: '🟡',
      label: 'Atenção',
      textColor: 'text-yellow-700'
    };
  }
  return {
    level: 'low',
    color: 'bg-red-100 text-red-700 border-red-300',
    dotColor: 'bg-red-500',
    icon: '🔴',
    label: 'Risco',
    textColor: 'text-red-700'
  };
};

// ==================== ALERTAS DE ATENÇÃO ====================

/**
 * Detecta pacientes que precisam de atenção
 * @param {Array} patients - Lista de pacientes com stats
 * @returns {Array} Lista de alertas priorizados (máx 5)
 */
export const detectAttentionNeeded = (patients = []) => {
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  patients.forEach((patient) => {
    const stats = patient.stats || {};

    // P1 - Novo paciente sem plano (alta prioridade)
    if (!stats.has_active_plan && patient.created_at) {
      const createdDate = new Date(patient.created_at);
      const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreated <= 7) {
        alerts.push({
          id: `no_plan_${patient.id}`,
          patientId: patient.id,
          patientName: patient.name,
          type: 'no_plan',
          priority: 1,
          icon: '📋',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'Novo Paciente Sem Plano',
          message: `${patient.name} está aguardando plano alimentar`,
          actions: [
            { label: 'Criar Plano', type: 'link', link: `/professional/patient/${patient.id}?tab=plano` }
          ]
        });
      }
    }

    // P2 - Sem checklist hoje
    if (stats.checklist_today === 0 && stats.has_active_plan) {
      alerts.push({
        id: `no_checklist_${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        type: 'no_checklist_today',
        priority: 2,
        icon: '⚠️',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        title: 'Sem Checklist Hoje',
        message: `${patient.name} ainda não marcou tarefas hoje`,
        actions: [
          { label: 'Enviar Lembrete', type: 'action', action: 'sendReminder' },
          { label: 'Ver Perfil', type: 'link', link: `/professional/patient/${patient.id}` }
        ]
      });
    }

    // P2 - Inativo 3+ dias
    if (patient.last_login) {
      const lastLogin = new Date(patient.last_login);
      const daysInactive = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      
      if (daysInactive >= 3) {
        alerts.push({
          id: `inactive_${patient.id}`,
          patientId: patient.id,
          patientName: patient.name,
          type: 'inactive_3d',
          priority: 2,
          icon: '😴',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          title: `${daysInactive} Dias Inativo`,
          message: `${patient.name} não acessa há ${daysInactive} dias`,
          actions: [
            { label: 'Enviar Feedback', type: 'action', action: 'sendFeedback' },
            { label: 'Ver Perfil', type: 'link', link: `/professional/patient/${patient.id}` }
          ]
        });
      }
    }

    // P3 - Sem feedback 7+ dias
    if (stats.days_since_last_feedback >= 7 && stats.has_active_plan) {
      alerts.push({
        id: `no_feedback_${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        type: 'no_feedback_7d',
        priority: 3,
        icon: '💬',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        title: 'Sem Feedback Recente',
        message: `${patient.name} não recebe feedback há ${stats.days_since_last_feedback} dias`,
        actions: [
          { label: 'Enviar Feedback', type: 'action', action: 'sendFeedback' }
        ]
      });
    }
  });

  // Ordenar por prioridade e retornar top 5
  return alerts
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
};

// ==================== MÉTRICAS AGREGADAS ====================

/**
 * Calcula número de pacientes ativos e inativos
 * @param {Array} patients - Lista de pacientes
 * @returns {Object} { active, inactive }
 */
export const calculateActiveInactive = (patients = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let active = 0;
  let inactive = 0;

  patients.forEach((patient) => {
    if (patient.last_login) {
      const lastLogin = new Date(patient.last_login);
      if (lastLogin >= sevenDaysAgo) {
        active++;
      } else {
        inactive++;
      }
    } else {
      inactive++;
    }
  });

  return { active, inactive };
};

/**
 * Calcula engajamento médio da base
 * @param {Array} patientsWithScore - Pacientes com score calculado
 * @returns {number} Percentual médio
 */
export const calculateAverageEngagement = (patientsWithScore = []) => {
  if (patientsWithScore.length === 0) return 0;
  
  const totalScore = patientsWithScore.reduce((sum, p) => sum + (p.engagementScore || 0), 0);
  return Math.round(totalScore / patientsWithScore.length);
};

/**
 * Conta planos ativos
 * @param {Array} patients - Lista de pacientes
 * @returns {number} Total de planos ativos
 */
export const countActivePlans = (patients = []) => {
  return patients.filter(p => p.stats?.has_active_plan).length;
};

/**
 * Calcula faturamento mensal (simulado)
 * @param {Array} patients - Lista de pacientes
 * @returns {number} Valor em R$
 */
export const calculateMonthlyRevenue = (patients = []) => {
  // Simulação: R$ 250 por paciente ativo
  const { active } = calculateActiveInactive(patients);
  return active * 250;
};

// ==================== DADOS DO GRÁFICO ====================

/**
 * Gera dados para gráfico de adesão ao checklist (7 dias)
 * @param {Array} patients - Lista de pacientes com histórico
 * @returns {Object} { labels, values }
 */
export const generateChecklistChartData = (patients = []) => {
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const today = new Date();
  const values = [];

  // Calcular para cada dia da semana
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - i);
    
    // Simulação de dados (em produção, vir do banco)
    // Porcentagem média de checklist completado naquele dia
    const avgCompletion = patients.reduce((sum, p) => {
      // Aqui viria a lógica real de buscar histórico
      // Por ora, usar valor atual ou simular
      return sum + (p.stats?.checklist_completion_7d || 0);
    }, 0) / (patients.length || 1);

    values.push(Math.round(avgCompletion));
  }

  return { labels, values };
};

// ==================== HELPERS ====================

/**
 * Formata moeda BRL
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata percentual
 */
export const formatPercentage = (value) => {
  return `${Math.round(value)}%`;
};

export default {
  calculatePatientEngagementScore,
  classifyEngagement,
  detectAttentionNeeded,
  calculateActiveInactive,
  calculateAverageEngagement,
  countActivePlans,
  calculateMonthlyRevenue,
  generateChecklistChartData,
  formatCurrency,
  formatPercentage
};
