import { useState, useEffect, useCallback } from 'react';
import { getProfessionalDashboardData } from '@/lib/supabase';
import {
  calculatePatientEngagementScore,
  classifyEngagement,
  detectAttentionNeeded,
  calculateActiveInactive,
  calculateAverageEngagement,
  countActivePlans,
  calculateMonthlyRevenue,
  generateChecklistChartData
} from '@/utils/professionalIntelligence';

/**
 * Hook centralizado para dados do Dashboard Profissional
 * @param {string} professionalId - ID do profissional logado
 * @returns {Object} Dados completos do dashboard
 */
export const useProfessionalDashboard = (professionalId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawPatients, setRawPatients] = useState([]);
  const [patientsWithScore, setPatientsWithScore] = useState([]);
  const [metrics, setMetrics] = useState({
    activePatients: 0,
    inactivePatients: 0,
    avgEngagement: 0,
    revenue: 0,
    activePlans: 0
  });
  const [attentionAlerts, setAttentionAlerts] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], values: [] });
  const [isLoadingRef, setIsLoadingRef] = useState(false); // Controle de loading

  /**
   * Carrega dados do dashboard
   */
  const loadDashboardData = useCallback(async () => {
    if (!professionalId || isLoadingRef) {
      return; // Evita múltiplas chamadas simultâneas
    }

    setIsLoadingRef(true);
    setLoading(true);
    setError(null);

    try {
      // 1. Buscar pacientes com estatísticas do banco
      const { data: patients, error: fetchError } = await getProfessionalDashboardData(professionalId);

      if (fetchError) throw fetchError;

      setRawPatients(patients || []);

      // 2. Calcular score de engajamento para cada paciente
      const enrichedPatients = (patients || []).map((patient) => {
        const score = calculatePatientEngagementScore(patient, patient.stats);
        const classification = classifyEngagement(score);

        return {
          ...patient,
          engagementScore: score,
          classification
        };
      });

      setPatientsWithScore(enrichedPatients);

      // 3. Calcular métricas agregadas
      const { active, inactive } = calculateActiveInactive(enrichedPatients);
      const avgEngagement = calculateAverageEngagement(enrichedPatients);
      const activePlans = countActivePlans(enrichedPatients);
      const revenue = calculateMonthlyRevenue(enrichedPatients);

      setMetrics({
        activePatients: active,
        inactivePatients: inactive,
        avgEngagement,
        revenue,
        activePlans
      });

      // 4. Detectar alertas de atenção
      const alerts = detectAttentionNeeded(enrichedPatients);
      setAttentionAlerts(alerts);

      // 5. Gerar dados do gráfico
      const chart = generateChecklistChartData(enrichedPatients);
      setChartData(chart);

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      setIsLoadingRef(false);
    }
  }, [professionalId, isLoadingRef]);

  /**
   * Recarregar dados
   */
  const refresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Carregar dados na montagem (APENAS UMA VEZ)
  useEffect(() => {
    if (professionalId) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId]); // Apenas quando professionalId mudar

  return {
    loading,
    error,
    metrics,
    attentionAlerts,
    patientsWithScore,
    chartData,
    refresh,
    // Dados raw para uso específico
    rawPatients
  };
};

export default useProfessionalDashboard;
