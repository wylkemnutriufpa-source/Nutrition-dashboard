import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found.');
}

// Configuração simplificada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
});

// ==================== AUTH HELPERS ====================

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};

export const getUserProfile = async (userId) => {
  // Tentar por id
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  // Tentar por auth_user_id
  if (error || !data) {
    const result = await supabase.from('profiles').select('*').eq('auth_user_id', userId).single();
    data = result.data;
    error = result.error;
  }
  
  // Tentar por email
  if (error || !data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const result = await supabase.from('profiles').select('*').eq('email', user.email).single();
      data = result.data;
    }
  }
  
  return data || null;
};

export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// ==================== PROFILE HELPERS ====================

export const getProfileById = async (profileId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .is('deleted_at', null)
    .single();
  return { data, error };
};

export const updateProfile = async (profileId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();
  return { data, error };
};

// ==================== PATIENTS MANAGEMENT ====================

// Buscar pacientes do profissional (ou todos se admin)
export const getProfessionalPatients = async (professionalId, isAdmin = false, filters = {}) => {
  let query = supabase
    .from('patient_profiles')
    .select(`
      *,
      patient:profiles!patient_id(*)
    `)
    .is('patient.deleted_at', null);
  
  // Se não for admin, filtra apenas pelos pacientes do profissional
  if (!isAdmin) {
    query = query.eq('professional_id', professionalId);
  } else if (filters.professionalId) {
    // Admin pode filtrar por profissional específico
    query = query.eq('professional_id', filters.professionalId);
  }
  
  // Filtro de status
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  // Ordenação
  if (filters.orderBy === 'name') {
    query = query.order('patient(name)', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const getPatientById = async (patientId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', patientId)
    .eq('role', 'patient')
    .is('deleted_at', null)
    .single();
  return { data, error };
};

export const createPatientByProfessional = async (professionalId, patientData) => {
  // Verificar email existente
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', patientData.email)
    .single();
  
  if (existing) {
    return { data: null, error: { message: 'Email já cadastrado no sistema' } };
  }

  const patientId = crypto.randomUUID();
  
  // Criar profile
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
    return { data: null, error: profileError };
  }
  
  // Criar vínculo
  const { error: linkError } = await supabase
    .from('patient_profiles')
    .insert({
      patient_id: patientId,
      professional_id: professionalId,
      status: 'active'
    });
  
  if (linkError) {
    await supabase.from('profiles').delete().eq('id', patientId);
    return { data: null, error: linkError };
  }
  
  // Criar anamnese vazia
  await supabase.from('anamnesis').insert({
    patient_id: patientId,
    professional_id: professionalId,
    status: 'incomplete'
  });
  
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

// Soft delete
export const archivePatient = async (patientId) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', patientId)
    .select()
    .single();
  return { data, error };
};

// Restaurar paciente
export const restorePatient = async (patientId) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ deleted_at: null, status: 'active' })
    .eq('id', patientId)
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

export const createAnamnesis = async (data) => {
  const { data: result, error } = await supabase
    .from('anamnesis')
    .insert(data)
    .select()
    .single();
  return { data: result, error };
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

export const saveAnamnesisDraft = async (patientId, professionalId, updates) => {
  // Verificar se existe
  const { data: existing } = await supabase
    .from('anamnesis')
    .select('id')
    .eq('patient_id', patientId)
    .single();
  
  if (existing) {
    return await updateAnamnesis(existing.id, { ...updates, status: 'draft' });
  } else {
    return await createAnamnesis({ ...updates, patient_id: patientId, professional_id: professionalId, status: 'draft' });
  }
};

// ==================== CHECKLIST / TASKS ====================

export const getChecklistTemplates = async (patientId) => {
  if (!patientId) {
    console.log('[getChecklistTemplates] No patientId provided');
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('order_index');
  return { data, error };
};

export const createChecklistTemplate = async (templateData) => {
  const { data, error } = await supabase
    .from('checklist_templates')
    .insert(templateData)
    .select()
    .single();
  return { data, error };
};

export const updateChecklistTemplate = async (templateId, updates) => {
  const { data, error } = await supabase
    .from('checklist_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single();
  return { data, error };
};

export const deleteChecklistTemplate = async (templateId) => {
  const { error } = await supabase
    .from('checklist_templates')
    .update({ is_active: false })
    .eq('id', templateId);
  return { error };
};

export const getChecklistEntries = async (patientId, startDate, endDate) => {
  if (!patientId) {
    console.log('[getChecklistEntries] No patientId provided');
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('checklist_entries')
    .select(`
      *,
      template:checklist_templates(*)
    `)
    .eq('patient_id', patientId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  return { data, error };
};

export const getChecklistEntriesForDate = async (patientId, date) => {
  if (!patientId) {
    console.log('[getChecklistEntriesForDate] No patientId provided');
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('checklist_entries')
    .select(`
      *,
      template:checklist_templates(*)
    `)
    .eq('patient_id', patientId)
    .eq('date', date);
  return { data, error };
};

export const toggleChecklistEntry = async (templateId, patientId, date, completed) => {
  // Upsert: criar se não existe, atualizar se existe
  const { data, error } = await supabase
    .from('checklist_entries')
    .upsert({
      template_id: templateId,
      patient_id: patientId,
      date: date,
      completed: completed,
      completed_at: completed ? new Date().toISOString() : null
    }, {
      onConflict: 'template_id,patient_id,date'
    })
    .select()
    .single();
  return { data, error };
};

// Calcular aderência dos últimos N dias
export const getChecklistAdherence = async (patientId, days = 7) => {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Buscar templates ativos
  const { data: templates } = await getChecklistTemplates(patientId);
  if (!templates || templates.length === 0) return { adherence: 0, completed: 0, total: 0 };
  
  // Buscar entries no período
  const { data: entries } = await getChecklistEntries(patientId, startDate, endDate);
  
  const totalPossible = templates.length * days;
  const completedCount = entries?.filter(e => e.completed).length || 0;
  
  return {
    adherence: totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0,
    completed: completedCount,
    total: totalPossible
  };
};

// ==================== PATIENT MESSAGES / TIPS ====================

export const getPatientMessages = async (patientId, onlyActive = true) => {
  if (!patientId) {
    console.log('[getPatientMessages] No patientId provided');
    return { data: [], error: null };
  }
  
  let query = supabase
    .from('patient_messages')
    .select('*')
    .eq('patient_id', patientId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (onlyActive) {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .lte('valid_from', today)
      .or(`valid_until.is.null,valid_until.gte.${today}`);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const createPatientMessage = async (messageData) => {
  const { data, error } = await supabase
    .from('patient_messages')
    .insert(messageData)
    .select()
    .single();
  return { data, error };
};

export const updatePatientMessage = async (messageId, updates) => {
  const { data, error } = await supabase
    .from('patient_messages')
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();
  return { data, error };
};

export const deletePatientMessage = async (messageId) => {
  const { error } = await supabase
    .from('patient_messages')
    .delete()
    .eq('id', messageId);
  return { error };
};

export const markMessageAsRead = async (messageId) => {
  const { data, error } = await supabase
    .from('patient_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();
  return { data, error };
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
    .select(`*, patient:profiles!patient_id(id, name, email)`)
    .eq('id', planId)
    .single();
  return { data, error };
};

export const getPatientMealPlan = async (patientId, professionalId = null) => {
  if (!patientId) {
    console.log('[getPatientMealPlan] No patientId provided');
    return { data: null, error: null };
  }
  
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
  const { error } = await supabase.from('meal_plans').delete().eq('id', planId);
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
    .insert({ professional_id: professionalId, source: 'CUSTOM', ...foodData })
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
  const { error } = await supabase.from('custom_foods').delete().eq('id', foodId);
  return { error };
};

// ==================== PROFESSIONALS (Admin) ====================

export const getAllProfessionals = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'professional')
    .is('deleted_at', null)
    .order('name');
  return { data, error };
};

// ==================== STATISTICS ====================

export const getProfessionalStats = async (professionalId, isAdmin = false) => {
  let patientQuery = supabase
    .from('patient_profiles')
    .select('*, patient:profiles!patient_id(*)', { count: 'exact' });
  
  if (!isAdmin) {
    patientQuery = patientQuery.eq('professional_id', professionalId);
  }
  
  const { data: patients, count: totalPatients } = await patientQuery
    .eq('status', 'active')
    .is('patient.deleted_at', null);
  
  // Planos ativos
  let plansQuery = supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (!isAdmin) {
    plansQuery = plansQuery.eq('professional_id', professionalId);
  }
  
  const { count: activePlans } = await plansQuery;
  
  // Pacientes recentes
  let recentQuery = supabase
    .from('patient_profiles')
    .select('*, patient:profiles!patient_id(*)')
    .is('patient.deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!isAdmin) {
    recentQuery = recentQuery.eq('professional_id', professionalId);
  }
  
  const { data: recentPatients } = await recentQuery;
  
  return {
    activePatients: totalPatients || 0,
    totalPatients: totalPatients || 0,
    activePlans: activePlans || 0,
    recentPatients: recentPatients || []
  };
};

export const getPatientStats = async (patientId) => {
  if (!patientId) {
    console.log('[getPatientStats] No patientId provided');
    return { profile: null, activePlan: null, anamnesis: null, adherence: { adherence: 0, completed: 0, total: 0 } };
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', patientId)
    .single();
  
  const { data: activePlan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .single();
  
  const { data: anamnesis } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const adherence = await getChecklistAdherence(patientId, 7);
  
  return { profile, activePlan, anamnesis, adherence };
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
    .upsert({ user_id: userId, ...brandingData })
    .select()
    .single();
  return { data, error };
};

// ==================== MENU CONFIG ====================

const DEFAULT_MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'Home', route: '/patient/dashboard', visible: true, order: 0 },
  { key: 'meal_plan', label: 'Meu Plano', icon: 'Utensils', route: '/patient/meal-plan', visible: true, order: 1 },
  { key: 'tasks', label: 'Minhas Tarefas', icon: 'ClipboardList', route: '/patient/checklist', visible: true, order: 2 },
  { key: 'feedback', label: 'Meus Feedbacks', icon: 'MessageSquare', route: '/patient/feedback', visible: true, order: 3 },
  { key: 'recipes', label: 'Minhas Receitas', icon: 'ChefHat', route: '/patient/recipes', visible: true, order: 4 },
  { key: 'shopping', label: 'Lista de Compras', icon: 'ShoppingCart', route: '/patient/shopping-list', visible: true, order: 5 },
  { key: 'supplements', label: 'Suplementos', icon: 'Pill', route: '/patient/supplements', visible: true, order: 6 },
  { key: 'tips', label: 'Dicas', icon: 'Lightbulb', route: '/patient/tips', visible: true, order: 7 },
  { key: 'journey', label: 'Minha Jornada', icon: 'TrendingUp', route: '/patient/journey', visible: true, order: 8 },
  { key: 'calculators', label: 'Calculadoras', icon: 'Calculator', route: '/patient/calculators', visible: true, order: 9 }
];

export const getPatientMenuConfig = async (patientId, professionalId) => {
  console.log('[getPatientMenuConfig] patientId:', patientId, 'professionalId:', professionalId);
  
  // Se não tem patientId e professionalId, retorna padrão
  if (!patientId && !professionalId) {
    console.log('[getPatientMenuConfig] No IDs provided, returning default');
    return { data: { items: DEFAULT_MENU_ITEMS }, error: null };
  }
  
  // Se tem patientId válido, tenta buscar config específica do paciente
  if (patientId) {
    const { data, error } = await supabase
      .from('patient_menu_configs')
      .select('*')
      .eq('patient_id', patientId)
      .single();
    
    if (data) {
      console.log('[getPatientMenuConfig] Found patient-specific config');
      return { data, error: null };
    }
  }
  
  // Se tem professionalId válido, busca config padrão do profissional
  if (professionalId) {
    const { data, error } = await supabase
      .from('patient_menu_configs')
      .select('*')
      .eq('professional_id', professionalId)
      .is('patient_id', null)
      .single();
    
    if (data) {
      console.log('[getPatientMenuConfig] Found professional default config');
      return { data, error: null };
    }
  }
  
  // Se não encontrou nada, retorna os itens padrão
  console.log('[getPatientMenuConfig] No config found, returning default');
  return { data: { items: DEFAULT_MENU_ITEMS }, error: null };
};

export const saveMenuConfig = async (professionalId, patientId, items) => {
  const { data, error } = await supabase
    .from('patient_menu_configs')
    .upsert({
      professional_id: professionalId,
      patient_id: patientId,
      items
    }, {
      onConflict: 'professional_id,patient_id'
    })
    .select()
    .single();
  return { data, error };
};

export const getDefaultMenuItems = () => DEFAULT_MENU_ITEMS;

// ==================== RECIPES ====================

export const getRecipes = async (professionalId, patientId = null) => {
  let query = supabase.from('recipes').select('*');
  
  if (patientId) {
    // Paciente vê receitas públicas do seu profissional ou específicas para ele
    query = query.or(`is_public.eq.true,visible_to_patients.cs.{${patientId}}`);
    query = query.eq('professional_id', professionalId);
  } else {
    // Profissional vê todas as suas receitas
    query = query.eq('professional_id', professionalId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

export const getRecipeById = async (recipeId) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();
  return { data, error };
};

export const createRecipe = async (recipeData) => {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single();
  return { data, error };
};

export const updateRecipe = async (recipeId, updates) => {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', recipeId)
    .select()
    .single();
  return { data, error };
};

export const deleteRecipe = async (recipeId) => {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
  return { error };
};

// ==================== SUPPLEMENTS ====================

export const getPatientSupplements = async (patientId) => {
  if (!patientId) {
    console.log('[getPatientSupplements] No patientId provided');
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('patient_supplements')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('time_of_day', { ascending: true });
  return { data, error };
};

export const createSupplement = async (supplementData) => {
  const { data, error } = await supabase
    .from('patient_supplements')
    .insert(supplementData)
    .select()
    .single();
  return { data, error };
};

export const updateSupplement = async (supplementId, updates) => {
  const { data, error } = await supabase
    .from('patient_supplements')
    .update(updates)
    .eq('id', supplementId)
    .select()
    .single();
  return { data, error };
};

export const deleteSupplement = async (supplementId) => {
  const { error } = await supabase
    .from('patient_supplements')
    .update({ is_active: false })
    .eq('id', supplementId);
  return { error };
};

// ==================== PATIENT JOURNEY ====================

export const getPatientJourney = async (patientId, limit = 50) => {
  if (!patientId) {
    console.log('[getPatientJourney] No patientId provided');
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('patient_journey')
    .select('*, meal_plan:meal_plans(id, name)')
    .eq('patient_id', patientId)
    .order('record_date', { ascending: false })
    .limit(limit);
  return { data, error };
};

export const createJourneyEntry = async (entryData) => {
  const { data, error } = await supabase
    .from('patient_journey')
    .insert(entryData)
    .select()
    .single();
  return { data, error };
};

export const updateJourneyEntry = async (entryId, updates) => {
  const { data, error } = await supabase
    .from('patient_journey')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();
  return { data, error };
};

export const deleteJourneyEntry = async (entryId) => {
  const { error } = await supabase.from('patient_journey').delete().eq('id', entryId);
  return { error };
};

// ==================== PATIENT FEEDBACKS ====================

export const getPatientFeedbacks = async (patientId) => {
  if (!patientId) {
    console.log('[getPatientFeedbacks] No patientId provided');
    return { data: [], error: null };
  }
  
  const { data, error } = await supabase
    .from('patient_feedbacks')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getProfessionalFeedbacks = async (professionalId, unreadOnly = false) => {
  let query = supabase
    .from('patient_feedbacks')
    .select('*, patient:profiles!patient_id(id, name, email)')
    .eq('professional_id', professionalId);
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

export const createFeedback = async (feedbackData) => {
  const { data, error } = await supabase
    .from('patient_feedbacks')
    .insert(feedbackData)
    .select()
    .single();
  return { data, error };
};

export const respondToFeedback = async (feedbackId, response) => {
  const { data, error } = await supabase
    .from('patient_feedbacks')
    .update({
      professional_response: response,
      responded_at: new Date().toISOString(),
      is_read: true
    })
    .eq('id', feedbackId)
    .select()
    .single();
  return { data, error };
};

export const markFeedbackAsRead = async (feedbackId) => {
  const { data, error } = await supabase
    .from('patient_feedbacks')
    .update({ is_read: true })
    .eq('id', feedbackId)
    .select()
    .single();
  return { data, error };
};

// ==================== PROJECT CTA CONFIG ====================

export const getProjectCTAConfig = async (professionalId) => {
  // Busca config específica ou usa valores padrão
  const { data, error } = await supabase
    .from('project_cta_config')
    .select('*')
    .eq('professional_id', professionalId)
    .single();
  
  if (error || !data) {
    // Retorna config padrão
    return {
      data: {
        texts: {
          magreza: {
            title: 'Precisando ganhar peso de forma saudável?',
            description: 'Com um plano alimentar personalizado, você pode alcançar seu peso ideal com saúde e energia.'
          },
          normal: {
            title: 'Quer manter sua saúde em dia?',
            description: 'Um acompanhamento nutricional pode ajudar você a manter seus resultados e melhorar ainda mais.'
          },
          sobrepeso: {
            title: 'Hora de cuidar da sua saúde!',
            description: 'Com orientação profissional, você pode alcançar seu peso ideal de forma saudável e sustentável.'
          },
          obesidade: {
            title: 'Sua saúde merece atenção especial',
            description: 'Acompanhamento nutricional profissional é essencial para uma mudança segura e eficaz.'
          },
          default: {
            title: 'Quer um plano alimentar personalizado?',
            description: 'Com base nas suas respostas, você pode ter um plano totalmente personalizado.'
          }
        },
        whatsapp_number: '5591980124814',
        whatsapp_message: 'Olá! Acabei de usar a calculadora no FitJourney e gostaria de saber mais sobre o projeto.',
        instagram_url: 'https://www.instagram.com/dr_wylkem_raiol/',
        project_name: 'FitJourney',
        project_description: 'Transforme sua saúde com acompanhamento nutricional profissional',
        project_benefits: [
          'Plano alimentar 100% personalizado',
          'Acompanhamento semanal',
          'Receitas exclusivas',
          'Suporte via WhatsApp'
        ]
      },
      error: null
    };
  }
  
  return { data, error };
};

export const saveProjectCTAConfig = async (professionalId, configData) => {
  const { data, error } = await supabase
    .from('project_cta_config')
    .upsert({
      professional_id: professionalId,
      ...configData
    })
    .select()
    .single();
  return { data, error };
};

// ==================== SHOPPING LIST (baseada no plano) ====================

export const generateShoppingList = async (mealPlanId) => {
  const { data: plan, error } = await supabase
    .from('meal_plans')
    .select('plan_data')
    .eq('id', mealPlanId)
    .single();
  
  if (error || !plan) return { data: null, error };
  
  // Agregar alimentos de todas as refeições
  const foodMap = new Map();
  
  plan.plan_data?.meals?.forEach(meal => {
    meal.foods?.forEach(food => {
      const key = food.name?.toLowerCase();
      if (key) {
        if (foodMap.has(key)) {
          const existing = foodMap.get(key);
          existing.quantity = (existing.quantity || 0) + (food.quantity || 1);
        } else {
          foodMap.set(key, {
            name: food.name,
            quantity: food.quantity || 1,
            unit: food.unit || 'porção',
            category: food.category || 'Outros'
          });
        }
      }
    });
  });
  
  // Agrupar por categoria
  const groupedList = {};
  foodMap.forEach((item) => {
    const category = item.category || 'Outros';
    if (!groupedList[category]) {
      groupedList[category] = [];
    }
    groupedList[category].push(item);
  });
  
  return { data: groupedList, error: null };
};
