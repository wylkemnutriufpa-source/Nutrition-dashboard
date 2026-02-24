// Sistema de White-Label / Branding
// Hierarquia: GLOBAL (ADM) > PROFESSIONAL > Paciente herda do profissional

export const DEFAULT_BRANDING = {
  logo: null, // URL ou base64
  brandName: 'FitJourney',
  primaryColor: '#0F766E', // teal-700
  accentColor: '#059669', // green-600
  footerText: 'Sua jornada para uma vida mais saudável',
  welcomeMessage: 'Bem-vindo ao seu painel de nutrição'
};

// Estrutura que seria no Supabase:
// Table: branding_configs
// Columns:
// - id (uuid, primary key)
// - user_email (text, unique) - null para global
// - user_type (text) - 'ADMIN', 'PROFESSIONAL'
// - logo (text) - URL ou base64
// - brand_name (text)
// - primary_color (text)
// - accent_color (text)
// - footer_text (text)
// - welcome_message (text)
// - created_at (timestamp)
// - updated_at (timestamp)

// Helper functions
export const getGlobalBranding = () => {
  const stored = localStorage.getItem('fitjourney_branding_global');
  return stored ? JSON.parse(stored) : DEFAULT_BRANDING;
};

export const saveGlobalBranding = (branding) => {
  localStorage.setItem('fitjourney_branding_global', JSON.stringify({
    ...branding,
    updated_at: new Date().toISOString()
  }));
  return true;
};

export const getProfessionalBranding = (email) => {
  const key = `fitjourney_branding_pro_${email}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
};

export const saveProfessionalBranding = (email, branding) => {
  const key = `fitjourney_branding_pro_${email}`;
  localStorage.setItem(key, JSON.stringify({
    ...branding,
    userEmail: email,
    updated_at: new Date().toISOString()
  }));
  return true;
};

export const getActiveBranding = () => {
  const userType = localStorage.getItem('fitjourney_user_type');
  const userEmail = localStorage.getItem('fitjourney_user_email');
  
  // Se for profissional, tenta pegar branding personalizado
  if (userType === 'professional' && userEmail) {
    const proBranding = getProfessionalBranding(userEmail);
    if (proBranding) {
      return { ...getGlobalBranding(), ...proBranding };
    }
  }
  
  // Se for paciente, pega branding do profissional (mock: usar global por enquanto)
  // Em produção, faria query para pegar o email do profissional do paciente
  if (userType === 'patient') {
    // TODO: Buscar profissional do paciente e retornar seu branding
    return getGlobalBranding();
  }
  
  // Default: branding global
  return getGlobalBranding();
};

export const applyBrandingToDOM = (branding) => {
  const root = document.documentElement;
  
  // Aplicar cores CSS customizadas
  if (branding.primaryColor) {
    root.style.setProperty('--color-primary', branding.primaryColor);
  }
  
  if (branding.accentColor) {
    root.style.setProperty('--color-accent', branding.accentColor);
  }
};

export const resetToDefault = () => {
  const userType = localStorage.getItem('fitjourney_user_type');
  const userEmail = localStorage.getItem('fitjourney_user_email');
  
  if (userType === 'professional' && userEmail) {
    const key = `fitjourney_branding_pro_${userEmail}`;
    localStorage.removeItem(key);
  }
  
  return DEFAULT_BRANDING;
};

// Converter imagem para base64 para storage
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
