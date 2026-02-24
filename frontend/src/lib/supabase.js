import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
// IMPORTANTE: Estas variáveis devem estar no .env do frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Using mock mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }
  return data;
};

export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const linkPatientToProfessional = async (patientId, professionalId) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .insert({ patient_id: patientId, professional_id: professionalId })
    .select()
    .single();
  
  return { data, error };
};

export const getProfessionalPatients = async (professionalId) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select(`
      *,
      patient:profiles!patient_id(*)
    `)
    .eq('professional_id', professionalId);
  
  return { data, error };
};
