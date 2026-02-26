// Sistema de White-Label / Branding
// Hierarquia: GLOBAL (ADM) > PROFESSIONAL > Paciente herda do profissional
// AGORA PERSISTIDO NO SUPABASE (não mais em localStorage)

import { 
  getCurrentProfessionalBranding, 
  getPatientProfessionalBranding,
  upsertProfessionalBranding 
} from '@/lib/supabase';

export const DEFAULT_BRANDING = {
  logo_url: null,
  primary_color: '#059669', // green-600
  secondary_color: '#10b981', // green-500
  accent_color: '#34d399' // green-400
};

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Busca o branding ativo do usuário logado
 * - Se profissional: retorna seu branding
 * - Se paciente: retorna branding do seu profissional
 * - Default: branding padrão
 */
export const getActiveBranding = async () => {
  try {
    const userType = localStorage.getItem('fitjourney_user_type');
    
    if (userType === 'professional') {
      const { data, error } = await getCurrentProfessionalBranding();
      if (error) {
        console.error('Erro ao buscar branding profissional:', error);
        return DEFAULT_BRANDING;
      }
      return data || DEFAULT_BRANDING;
    }
    
    if (userType === 'patient') {
      const { data, error } = await getPatientProfessionalBranding();
      if (error) {
        console.error('Erro ao buscar branding do profissional:', error);
        return DEFAULT_BRANDING;
      }
      return data || DEFAULT_BRANDING;
    }
    
    // Admin ou visitante
    return DEFAULT_BRANDING;
  } catch (error) {
    console.error('Erro ao buscar branding:', error);
    return DEFAULT_BRANDING;
  }
};

/**
 * Salva o branding do profissional no Supabase
 * @param {string} professionalId - UUID do profissional
 * @param {Object} branding - {logo_url, primary_color, secondary_color, accent_color}
 */
export const saveProfessionalBranding = async (professionalId, branding) => {
  try {
    const { data, error } = await upsertProfessionalBranding(professionalId, branding);
    if (error) {
      console.error('Erro ao salvar branding:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao salvar branding:', error);
    return { success: false, error };
  }
};

/**
 * DEPRECATED - Mantido para compatibilidade
 * @deprecated Use getActiveBranding() async
 */
export const getGlobalBranding = () => {
  console.warn('getGlobalBranding() deprecated - use getActiveBranding() async');
  return DEFAULT_BRANDING;
};

/**
 * DEPRECATED - Mantido para compatibilidade
 * @deprecated Use saveProfessionalBranding() async
 */
export const saveGlobalBranding = (branding) => {
  console.warn('saveGlobalBranding() deprecated - use saveProfessionalBranding() async');
  return true;
};

/**
 * DEPRECATED - Mantido para compatibilidade
 * @deprecated Use getActiveBranding() async
 */
export const getProfessionalBranding = (email) => {
  console.warn('getProfessionalBranding() deprecated - use getActiveBranding() async');
  return null;
};

/**
 * Aplica o branding ao DOM (CSS variables)
 */
export const applyBrandingToDOM = (branding) => {
  const root = document.documentElement;
  
  if (branding?.primary_color) {
    root.style.setProperty('--color-primary', branding.primary_color);
  }
  
  if (branding?.secondary_color) {
    root.style.setProperty('--color-secondary', branding.secondary_color);
  }
  
  if (branding?.accent_color) {
    root.style.setProperty('--color-accent', branding.accent_color);
  }
};

/**
 * Reseta para branding padrão
 */
export const resetToDefault = () => {
  return DEFAULT_BRANDING;
};

/**
 * Converte imagem para base64
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
