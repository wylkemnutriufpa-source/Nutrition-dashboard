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

// ==================== CUSTOM FOODS ====================

export const getCustomFoods = async (professionalId) => {
  const { data, error } = await supabase
    .from('custom_foods')
    .select('*')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const createCustomFood = async (professionalId, foodData) => {
  const { data, error } = await supabase
    .from('custom_foods')
    .insert({
      professional_id: professionalId,
      ...foodData
    })
    .select()
    .single();
  
  return { data, error };
};

export const updateCustomFood = async (foodId, updates) => {
  const { data, error } = await supabase
    .from('custom_foods')
    .update(updates)
    .eq('id', foodId)
    .select()
    .single();
  
  return { data, error };
};

export const deleteCustomFood = async (foodId) => {
  const { error } = await supabase
    .from('custom_foods')
    .delete()
    .eq('id', foodId);
  
  return { error };
};

// ==================== MEAL PLANS ====================

export const getMealPlans = async (userId, userRole) => {
  let query = supabase.from('meal_plans').select('*');
  
  if (userRole === 'professional') {
    query = query.eq('professional_id', userId);
  } else if (userRole === 'patient') {
    query = query.eq('patient_id', userId);
  }
  
  const { data, error } = await query.order('updated_at', { ascending: false });
  return { data, error };
};

export const getMealPlan = async (planId) => {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  return { data, error };
};

export const createMealPlan = async (planData) => {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert(planData)
    .select()
    .single();
  
  return { data, error };
};

export const updateMealPlan = async (planId, updates) => {
  const { data, error } = await supabase
    .from('meal_plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();
  
  return { data, error };
};

export const deleteMealPlan = async (planId) => {
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', planId);
  
  return { error };
};

// ==================== BRANDING ====================

export const getBranding = async (userId) => {
  const { data, error } = await supabase
    .from('branding_configs')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
};

export const saveBranding = async (userId, brandingData) => {
  const { data, error } = await supabase
    .from('branding_configs')
    .upsert({
      user_id: userId,
      ...brandingData
    })
    .select()
    .single();
  
  return { data, error };
};
