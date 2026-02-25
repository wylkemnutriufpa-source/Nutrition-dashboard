import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
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

// ==================== AUTH HELPERS ====================

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
  try {
    console.log('Attempting signup with:', { email, metadata });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin
      }
    });
    
    console.log('Signup response:', { data, error });
    return { data, error };
  } catch (err) {
    console.error('Signup exception:', err);
    return { data: null, error: err };
  }
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

// ==================== PROFILES ====================

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};

export const getAllProfessionals = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'professional')
    .order('name');
  
  return { data, error };
};

// ==================== PATIENT MANAGEMENT ====================

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
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getPatientById = async (patientId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', patientId)
    .eq('role', 'patient')
    .single();
  
  return { data, error };
};

// Criar paciente pelo profissional (sem auth - apenas profile)
export const createPatientByProfessional = async (professionalId, patientData) => {
  // Primeiro, verificar se email já existe
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', patientData.email)
    .single();
  
  if (existingUser) {
    return { data: null, error: { message: 'Email já cadastrado no sistema' } };
  }

  // Gerar UUID para o paciente
  const patientId = crypto.randomUUID();
  
  // Criar profile do paciente
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: patientId,
      email: patientData.email,
      name: patientData.name,
      phone: patientData.phone || null,
      role: 'patient',
      birth_date: patientData.birth_date || null,
      gender: patientData.gender || null,
      height: patientData.height || null,
      current_weight: patientData.current_weight || null,
      goal_weight: patientData.goal_weight || null,
      goal: patientData.goal || null,
      notes: patientData.notes || null,
      status: 'active'
    });
  
  if (profileError) {
    console.error('Error creating patient profile:', profileError);
    return { data: null, error: profileError };
  }
  
  // Criar vínculo com profissional
  const { error: linkError } = await supabase
    .from('patient_profiles')
    .insert({
      patient_id: patientId,
      professional_id: professionalId,
      status: 'active'
    });
  
  if (linkError) {
    // Rollback: deletar profile criado
    await supabase.from('profiles').delete().eq('id', patientId);
    console.error('Error linking patient:', linkError);
    return { data: null, error: linkError };
  }
  
  // Retornar dados do paciente criado
  const { data: patient } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', patientId)
    .single();
  
  return { data: patient, error: null };
};

export const updatePatient = async (patientId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', patientId)
    .select()
    .single();
  
  return { data, error };
};

export const deletePatient = async (patientId, professionalId) => {
  // Primeiro remove o vínculo
  const { error: linkError } = await supabase
    .from('patient_profiles')
    .delete()
    .eq('patient_id', patientId)
    .eq('professional_id', professionalId);
  
  if (linkError) {
    return { error: linkError };
  }
  
  // Depois pode opcionalmente deletar o profile (ou apenas inativar)
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'inactive' })
    .eq('id', patientId);
  
  return { error };
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
      source: 'CUSTOM',
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
  let query = supabase.from('meal_plans').select(`
    *,
    patient:profiles!patient_id(id, name, email)
  `);
  
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
    .select(`
      *,
      patient:profiles!patient_id(id, name, email)
    `)
    .eq('id', planId)
    .single();
  
  return { data, error };
};

export const getPatientMealPlan = async (patientId, professionalId = null) => {
  let query = supabase
    .from('meal_plans')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (professionalId) {
    query = query.eq('professional_id', professionalId);
  }
  
  const { data, error } = await query.single();
  return { data, error };
};

export const createMealPlan = async (planData) => {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      ...planData,
      plan_data: planData.plan_data || { meals: [] },
      daily_targets: planData.daily_targets || { calorias: 2000, proteina: 100, carboidrato: 250, gordura: 70 }
    })
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

// Desativar outros planos quando ativar um novo
export const setActiveMealPlan = async (planId, patientId, professionalId) => {
  // Desativar todos os planos do paciente
  await supabase
    .from('meal_plans')
    .update({ is_active: false })
    .eq('patient_id', patientId)
    .eq('professional_id', professionalId);
  
  // Ativar o plano selecionado
  const { data, error } = await supabase
    .from('meal_plans')
    .update({ is_active: true })
    .eq('id', planId)
    .select()
    .single();
  
  return { data, error };
};

// ==================== ANAMNESIS ====================

export const getAnamnesis = async (patientId) => {
  const { data, error } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return { data, error };
};

export const createAnamnesis = async (anamnesisData) => {
  const { data, error } = await supabase
    .from('anamnesis')
    .insert(anamnesisData)
    .select()
    .single();
  
  return { data, error };
};

export const updateAnamnesis = async (anamnesisId, updates) => {
  const { data, error } = await supabase
    .from('anamnesis')
    .update(updates)
    .eq('id', anamnesisId)
    .select()
    .single();
  
  return { data, error };
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

// ==================== ADMIN FUNCTIONS ====================

export const createProfessionalByAdmin = async (professionalData) => {
  // Admin cria um novo profissional via signup
  const { data, error } = await supabase.auth.admin.createUser({
    email: professionalData.email,
    password: professionalData.password || 'TempPass123!',
    email_confirm: true,
    user_metadata: {
      name: professionalData.name,
      role: 'professional'
    }
  });
  
  return { data, error };
};

// ==================== STATISTICS ====================

export const getProfessionalStats = async (professionalId) => {
  // Contar pacientes ativos
  const { count: activePatients } = await supabase
    .from('patient_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('status', 'active');
  
  // Contar total de pacientes
  const { count: totalPatients } = await supabase
    .from('patient_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId);
  
  // Contar planos ativos
  const { count: activePlans } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('is_active', true);
  
  // Buscar últimas consultas (pacientes recém criados/atualizados)
  const { data: recentPatients } = await supabase
    .from('patient_profiles')
    .select(`
      *,
      patient:profiles!patient_id(*)
    `)
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  return {
    activePatients: activePatients || 0,
    totalPatients: totalPatients || 0,
    activePlans: activePlans || 0,
    recentPatients: recentPatients || []
  };
};

export const getPatientStats = async (patientId) => {
  // Buscar profile do paciente
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', patientId)
    .single();
  
  // Buscar plano ativo
  const { data: activePlan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .single();
  
  // Buscar anamnese
  const { data: anamnesis } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return {
    profile,
    activePlan,
    anamnesis
  };
};
