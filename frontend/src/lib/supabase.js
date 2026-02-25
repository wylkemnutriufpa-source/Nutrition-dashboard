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
  console.log('📋 Buscando pacientes...', { professionalId, isAdmin, filters });
  
  try {
    // Primeiro buscar os vínculos patient_profiles
    let query = supabase
      .from('patient_profiles')
      .select('*');
    
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
    query = query.order('created_at', { ascending: false });
    
    const { data: links, error: linksError } = await query;
    
    if (linksError) {
      console.error('❌ Erro ao buscar vínculos');
      return { data: [], error: { message: 'Erro ao buscar pacientes' } };
    }
    
    if (!links || links.length === 0) {
      console.log('✅ 0 pacientes encontrados');
      return { data: [], error: null };
    }
    
    // Buscar os perfis dos pacientes
    const patientIds = links.map(link => link.patient_id);
    const { data: patients, error: patientsError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', patientIds);
    
    if (patientsError) {
      console.error('❌ Erro ao buscar perfis dos pacientes');
      return { data: [], error: { message: 'Erro ao buscar dados dos pacientes' } };
    }
    
    // Combinar dados
    const combined = links.map(link => ({
      ...link,
      patient: patients.find(p => p.id === link.patient_id) || null
    })).filter(item => item.patient !== null);
    
    console.log(`✅ ${combined.length} pacientes encontrados`);
    return { data: combined, error: null };
    
  } catch (error) {
    console.error('❌ Erro fatal ao buscar pacientes');
    return { data: [], error: { message: 'Erro fatal ao buscar pacientes' } };
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
  console.log('🆕 Criando paciente...', { professionalId, email: patientData.email });
  
  try {
    // Verificar email existente
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', patientData.email)
      .maybeSingle();
    
    if (existing) {
      console.warn('⚠️ Email já existe');
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
      console.error('❌ Erro ao criar profile');
      return { data: null, error: { message: 'Erro ao criar paciente' } };
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
      console.error('❌ Erro ao criar vínculo');
      // Tentar limpar profile criado
      await supabase.from('profiles').delete().eq('id', patientId);
      return { data: null, error: { message: 'Erro ao vincular paciente' } };
    }
    
    // Criar anamnese vazia (não bloquear se falhar)
    await supabase.from('anamnesis').insert({
      patient_id: patientId,
      professional_id: professionalId,
      status: 'incomplete'
    }).catch(err => {
      console.warn('⚠️ Erro ao criar anamnese (não crítico)', err);
    });
    
    // Buscar paciente criado
    const { data: patient } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .maybeSingle();
    
    if (!patient) {
      console.error('❌ Paciente criado mas não encontrado');
      return { data: null, error: { message: 'Erro ao buscar paciente criado' } };
    }
    
    console.log('✅ Paciente criado com sucesso');
    return { data: patient, error: null };
    
  } catch (error) {
    console.error('❌ Erro fatal ao criar paciente');
    return { data: null, error: { message: 'Erro fatal ao criar paciente' } };
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
