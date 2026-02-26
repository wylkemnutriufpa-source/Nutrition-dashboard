import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found.');
}

// SINGLETON: garantir que o client seja criado apenas uma vez
let supabaseInstance = null;

const createSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Evitar múltiplas detecções
      flowType: 'pkce', // Mais seguro que implicit
      // Storage customizado com tratamento de erros
      storage: {
        getItem: (key) => {
          try {
            return window.localStorage.getItem(key);
          } catch (error) {
            console.warn('Storage getItem error:', error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            window.localStorage.setItem(key, value);
          } catch (error) {
            console.warn('Storage setItem error:', error);
          }
        },
        removeItem: (key) => {
          try {
            window.localStorage.removeItem(key);
          } catch (error) {
            console.warn('Storage removeItem error:', error);
          }
        }
      }
    }
  });

  return supabaseInstance;
};

// Exportar o client singleton
export const supabase = createSupabaseClient();

// ==================== AUTH HELPERS ====================

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};

export const getUserProfile = async (userId) => {
  console.log('🔍 Buscando profile para userId:', userId);
  
  try {
    // Tentar buscar por id
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // maybeSingle() não lança erro se não encontrar
    
    if (error) {
      console.error('❌ Erro ao buscar profile:', error);
      
      // Se erro 406, pode ser problema de RLS ou perfil não existe
      if (error.code === 'PGRST116' || error.message.includes('406')) {
        console.warn('⚠️ Profile não encontrado ou bloqueado por RLS');
        
        // Tentar criar perfil automaticamente
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          console.log('🔧 Tentando criar profile automaticamente...');
          return await createMissingProfile(user);
        }
      }
      
      return null;
    }
    
    if (!data) {
      console.warn('⚠️ Profile não encontrado no banco');
      // Tentar criar perfil automaticamente
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        console.log('🔧 Tentando criar profile automaticamente...');
        return await createMissingProfile(user);
      }
      return null;
    }
    
    console.log('✅ Profile encontrado:', data.email, 'Role:', data.role);
    return data;
    
  } catch (error) {
    console.error('❌ Erro fatal ao buscar profile:', error);
    return null;
  }
};

// Criar perfil faltante automaticamente
const createMissingProfile = async (authUser) => {
  try {
    console.log('🆕 Criando profile para:', authUser.email);
    
    // Verificar se já existe por email
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle();
    
    if (existing) {
      console.log('✅ Profile já existe (encontrado por email)');
      return existing;
    }
    
    // Criar novo profile com role visitor por padrão
    // Admin precisa promover para professional ou admin depois
    const newProfile = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email.split('@')[0],
      role: 'visitor', // Papel padrão, admin pode alterar depois
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar profile:', error);
      return null;
    }
    
    console.log('✅ Profile criado com sucesso');
    return data;
    
  } catch (error) {
    console.error('❌ Erro fatal ao criar profile:', error);
    return null;
  }
};

export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const updatePassword = async (newPassword) => {
  console.log('🔐 Atualizando senha...');
  
  try {
    const result = await supabase.auth.updateUser({
      password: newPassword
    }).catch(err => {
      // Capturar erro do Supabase sem processar
      return { data: null, error: { message: 'Erro ao atualizar senha' } };
    });
    
    if (result.error) {
      console.error('❌ Erro ao atualizar senha');
      return { success: false, error: { message: 'Erro ao atualizar senha' } };
    }
    
    console.log('✅ Senha atualizada com sucesso');
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Erro fatal');
    return { success: false, error: { message: 'Erro fatal ao atualizar senha' } };
  }
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
  console.log('📋 Buscando pacientes do profissional:', professionalId);
  
  try {
    // Buscar pela tabela patient_profiles com JOIN em profiles
    let query = supabase
      .from('patient_profiles')
      .select('*, patient:profiles!patient_id(*)');
    
    // Se não for admin, filtrar por profissional
    if (!isAdmin) {
      query = query.eq('professional_id', professionalId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar pacientes:', error);
      return { data: [], error };
    }
    
    console.log(`✅ ${data?.length || 0} pacientes encontrados`);
    return { data: data || [], error: null };
    
  } catch (err) {
    console.error('❌ Erro fatal:', err);
    return { data: [], error: err };
  }
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
  console.log('🆕 Criando paciente...');
  
  const patientId = crypto.randomUUID();
  
  try {
    // 1. Criar usuário no Supabase Auth (com senha)
    if (patientData.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: patientData.email,
        password: patientData.password,
        options: {
          data: {
            name: patientData.name,
            role: 'patient'
          }
        }
      });

      if (authError) {
        console.error('❌ Erro auth:', authError);
        return { data: null, error: { message: authError.message || 'Erro ao criar conta' } };
      }

      console.log('✅ Auth criado:', authData.user?.id);
      
      // Usar o ID gerado pelo Auth
      const authUserId = authData.user?.id;
      
      if (authUserId) {
        // 2. Atualizar/criar profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authUserId,
            email: patientData.email,
            name: patientData.name,
            phone: patientData.phone || null,
            role: 'patient',
            status: 'active'
          });
        
        if (profileError) {
          console.error('❌ Erro profile:', profileError);
          return { data: null, error: { message: 'Erro ao criar perfil' } };
        }
        
        console.log('✅ Profile criado/atualizado');
        
        // 3. Criar vínculo
        try {
          await supabase
            .from('patient_profiles')
            .insert({
              patient_id: authUserId,
              professional_id: professionalId
            });
          console.log('✅ Vínculo criado');
        } catch (linkErr) {
          console.warn('⚠️ Vínculo não criado');
        }
        
        // 4. Anamnese (opcional)
        try {
          await supabase.from('anamnesis').insert({
            patient_id: authUserId,
            professional_id: professionalId,
            birth_date: patientData.birth_date,
            gender: patientData.gender,
            height: patientData.height,
            current_weight: patientData.current_weight,
            goal_weight: patientData.goal_weight,
            goal: patientData.goal,
            notes: patientData.notes
          });
          console.log('✅ Anamnese criada');
        } catch (anamErr) {
          console.warn('⚠️ Anamnese não criada');
        }
        
        return { 
          data: { 
            id: authUserId, 
            email: patientData.email, 
            name: patientData.name 
          }, 
          error: null 
        };
      }
    }
    
    return { data: null, error: { message: 'Senha é obrigatória' } };
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return { data: null, error: { message: error.message || 'Erro ao criar paciente' } };
  }
};

export const updatePatient = async (patientId, updates) => {
  console.log('✏️ Atualizando paciente...', { patientId });
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', patientId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erro ao atualizar paciente');
      return { data: null, error: { message: 'Erro ao atualizar paciente' } };
    }
    
    console.log('✅ Paciente atualizado');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao atualizar paciente');
    return { data: null, error: { message: 'Erro fatal ao atualizar paciente' } };
  }
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

// Calcular aderência simples (para o resumo do paciente)
export const getChecklistAdherence = async (patientId, days = 7) => {
  // Para MVP simples, apenas contar tarefas completas vs totais
  const { data: tasks } = await supabase
    .from('checklist_tasks')
    .select('*')
    .eq('patient_id', patientId);
  
  if (!tasks || tasks.length === 0) {
    return { adherence: 0, completed: 0, total: 0 };
  }
  
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { adherence, completed, total };
};

// ==================== PATIENT MESSAGES / TIPS ====================

export const getPatientMessages = async (patientId, onlyActive = true) => {
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
  
  const { data: patients, count: totalPatients } = await patientQuery;
  
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

// ==================== CHECKLIST SIMPLES (MVP) ====================

export const getChecklistTasks = async (patientId) => {
  const { data, error } = await supabase
    .from('checklist_tasks')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true });
  return { data, error };
};

export const createChecklistTask = async (patientId, title) => {
  const { data, error } = await supabase
    .from('checklist_tasks')
    .insert({ patient_id: patientId, title })
    .select()
    .single();
  return { data, error };
};

export const updateChecklistTask = async (taskId, updates) => {
  const { data, error } = await supabase
    .from('checklist_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  return { data, error };
};

export const toggleChecklistTask = async (taskId, completed) => {
  return await updateChecklistTask(taskId, { completed });
};

export const deleteChecklistTask = async (taskId) => {
  const { error } = await supabase
    .from('checklist_tasks')
    .delete()
    .eq('id', taskId);
  return { error };
};



// ==================== PATIENT MENU CONFIG ====================

// Menu padrão para pacientes
export const DEFAULT_PATIENT_MENU = [
  { id: 'meal-plan', name: 'Meu Plano', icon: 'Calendar', route: '/patient/meal-plan', visible: true, order: 1 },
  { id: 'tarefas', name: 'Minhas Tarefas', icon: 'ClipboardList', route: '/patient/tarefas', visible: true, order: 2 },
  { id: 'feedbacks', name: 'Meus Feedbacks', icon: 'MessageSquare', route: '/patient/feedbacks', visible: true, order: 3 },
  { id: 'receitas', name: 'Minhas Receitas', icon: 'ChefHat', route: '/patient/receitas', visible: true, order: 4 },
  { id: 'lista-compras', name: 'Minha Lista de Compras', icon: 'ShoppingCart', route: '/patient/lista-compras', visible: true, order: 5 },
  { id: 'suplementos', name: 'Suplementos', icon: 'Pill', route: '/patient/suplementos', visible: true, order: 6 },
  { id: 'dicas', name: 'Dicas', icon: 'Lightbulb', route: '/patient/dicas', visible: true, order: 7 },
  { id: 'jornada', name: 'Minha Jornada', icon: 'TrendingUp', route: '/patient/jornada', visible: true, order: 8 }
];

// Buscar configuração do menu do paciente
export const getPatientMenuConfig = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('patient_menu_config')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erro ao buscar menu config:', error);
      return { data: { menu_items: DEFAULT_PATIENT_MENU }, error: null };
    }
    
    if (!data) {
      // Retornar menu padrão se não existir configuração
      return { data: { menu_items: DEFAULT_PATIENT_MENU }, error: null };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao buscar menu config:', error);
    return { data: { menu_items: DEFAULT_PATIENT_MENU }, error };
  }
};

// Criar ou atualizar configuração do menu
export const upsertPatientMenuConfig = async (patientId, menuItems, professionalId = null) => {
  try {
    const { data, error } = await supabase
      .from('patient_menu_config')
      .upsert({
        patient_id: patientId,
        professional_id: professionalId,
        menu_items: menuItems,
        updated_at: new Date().toISOString()
      }, { onConflict: 'patient_id' })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao salvar menu config:', error);
      return { data: null, error };
    }
    
    console.log('✅ Menu config salvo:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao salvar menu config:', error);
    return { data: null, error };
  }
};

// ==================== PATIENT JOURNEY ====================

// Buscar jornada do paciente
export const getPatientJourney = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('patient_journey')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erro ao buscar jornada:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao buscar jornada:', error);
    return { data: null, error };
  }
};

// Criar/atualizar jornada do paciente
export const upsertPatientJourney = async (patientId, journeyData) => {
  try {
    const { data, error } = await supabase
      .from('patient_journey')
      .upsert({
        patient_id: patientId,
        ...journeyData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao salvar jornada:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao salvar jornada:', error);
    return { data: null, error };
  }
};

// Buscar histórico de peso
export const getWeightHistory = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('weight_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar histórico de peso:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao buscar histórico de peso:', error);
    return { data: [], error };
  }
};

// Adicionar registro de peso
export const addWeightRecord = async (patientId, weight, notes = '') => {
  try {
    const { data, error } = await supabase
      .from('weight_history')
      .insert({
        patient_id: patientId,
        weight,
        notes,
        recorded_at: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao adicionar peso:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao adicionar peso:', error);
    return { data: null, error };
  }
};

// Buscar fotos de progresso
export const getProgressPhotos = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('patient_id', patientId)
      .order('taken_at', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar fotos:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao buscar fotos:', error);
    return { data: [], error };
  }
};

// Upload de foto de perfil do paciente
export const uploadProfilePhoto = async (userId, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `profile_${userId}_${Date.now()}.${fileExt}`;

    // Tentar upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      return await updateProfile(userId, { photo_url: publicUrl });
    }

    // Fallback: base64 direto no profile
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = await updateProfile(userId, { photo_url: reader.result });
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload da foto:', error);
    return { data: null, error };
  }
};

// Adicionar foto de progresso
export const addProgressPhoto = async (patientId, photoUrl, photoType = 'progress', notes = '') => {
  try {
    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        patient_id: patientId,
        photo_url: photoUrl,
        photo_type: photoType,
        notes,
        taken_at: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao adicionar foto:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro fatal ao adicionar foto:', error);
    return { data: null, error };
  }
};


// ==================== AGENDA DE CONSULTAS ====================

export const getAppointments = async (professionalId) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patient:profiles!patient_id(id, name, email, phone)')
    .eq('professional_id', professionalId)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  return { data: data || [], error };
};

export const getPatientAppointments = async (patientId) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true });
  return { data: data || [], error };
};

export const createAppointment = async (appointmentData) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();
  return { data, error };
};

export const updateAppointment = async (id, updates) => {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const deleteAppointment = async (id) => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  return { error };
};

// ==================== GESTÃO FINANCEIRA ====================

export const getFinancialRecords = async (professionalId, year = null) => {
  let query = supabase
    .from('financial_records')
    .select('*, patient:profiles!patient_id(id, name)')
    .eq('professional_id', professionalId)
    .order('date', { ascending: false });
  if (year) {
    query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
  }
  const { data, error } = await query;
  return { data: data || [], error };
};

export const createFinancialRecord = async (record) => {
  const { data, error } = await supabase
    .from('financial_records')
    .insert(record)
    .select()
    .single();
  return { data, error };
};

export const updateFinancialRecord = async (id, updates) => {
  const { data, error } = await supabase
    .from('financial_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const deleteFinancialRecord = async (id) => {
  const { error } = await supabase.from('financial_records').delete().eq('id', id);
  return { error };
};

// ==================== PLANO FINANCEIRO DO PACIENTE ====================

export const getPatientPlan = async (patientId) => {
  const { data, error } = await supabase
    .from('patient_plans')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
};

export const upsertPatientPlan = async (patientId, planData) => {
  const { data: existing } = await supabase
    .from('patient_plans')
    .select('id')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('patient_plans')
      .update({ ...planData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('patient_plans')
      .insert({ patient_id: patientId, ...planData })
      .select()
      .single();
    return { data, error };
  }
};

// ==================== BRANDING ====================

/**
 * Busca o branding de um profissional
 * @param {string} professionalId - UUID do profissional
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const getProfessionalBranding = async (professionalId) => {
  const { data, error } = await supabase
    .from('professional_branding')
    .select('*')
    .eq('professional_id', professionalId)
    .maybeSingle();
  return { data, error };
};

/**
 * Atualiza ou cria branding do profissional
 * @param {string} professionalId - UUID do profissional
 * @param {Object} brandingData - {logo_url, primary_color, secondary_color, accent_color}
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const upsertProfessionalBranding = async (professionalId, brandingData) => {
  const { data: existing } = await supabase
    .from('professional_branding')
    .select('id')
    .eq('professional_id', professionalId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('professional_branding')
      .update({ ...brandingData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('professional_branding')
      .insert({ professional_id: professionalId, ...brandingData })
      .select()
      .single();
    return { data, error };
  }
};

/**
 * Busca branding do profissional atual logado
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const getCurrentProfessionalBranding = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: { message: 'Usuário não autenticado' } };

    // O professional_id é o próprio user.id (não há tabela professional_profiles separada)
    return await getProfessionalBranding(user.id);
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Busca branding do profissional do paciente atual
 * Usado quando paciente está logado e precisa ver o branding do seu nutricionista
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const getPatientProfessionalBranding = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: { message: 'Usuário não autenticado' } };

    // Buscar o patient_profile do usuário atual para pegar professional_id
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('professional_id')
      .eq('patient_id', user.id)
      .maybeSingle();

    if (profileError || !patientProfile) {
      return { data: null, error: profileError || { message: 'Perfil de paciente não encontrado' } };
    }

    return await getProfessionalBranding(patientProfile.professional_id);
  } catch (error) {
    return { data: null, error };
  }
};
