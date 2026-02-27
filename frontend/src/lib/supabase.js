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
    .maybeSingle();
  return { data, error };
};

export const createAnamnesis = async (data) => {
  // Primeiro verificar se já existe anamnese para esse paciente
  const { data: existing } = await supabase
    .from('anamnesis')
    .select('id')
    .eq('patient_id', data.patient_id)
    .maybeSingle();
  
  if (existing) {
    // Se já existe, atualizar
    console.log('📝 Já existe anamnese, atualizando:', existing.id);
    return await updateAnamnesis(existing.id, data);
  }
  
  // Se não existe, criar nova
  console.log('✨ Criando nova anamnese');
  const { data: result, error } = await supabase
    .from('anamnesis')
    .insert({
      ...data,
      created_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('❌ Erro ao criar anamnese:', error);
  }
  
  return { data: result, error };
};

export const updateAnamnesis = async (anamnesisId, updates) => {
  console.log('🔄 Atualizando anamnese:', anamnesisId, updates);
  const { data, error } = await supabase
    .from('anamnesis')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', anamnesisId)
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('❌ Erro ao atualizar:', error);
  } else {
    console.log('✅ Anamnese atualizada:', data);
  }
  
  return { data, error };
};

export const saveAnamnesisDraft = async (patientId, professionalId, updates) => {
  // Verificar se existe
  const { data: existing } = await supabase
    .from('anamnesis')
    .select('id')
    .eq('patient_id', patientId)
    .maybeSingle();
  
  if (existing) {
    return await updateAnamnesis(existing.id, { ...updates, status: 'draft' });
  } else {
    return await createAnamnesis({ ...updates, patient_id: patientId, professional_id: professionalId, status: 'draft' });
  }
};

// ==================== DRAFT MEAL PLAN (PRÉ-PLANO) ====================

/**
 * Salva pré-plano gerado pela anamnese inteligente
 * Visível apenas para profissionais
 */
export const saveDraftMealPlan = async (patientId, professionalId, draftPlan) => {
  try {
    // Verificar se já existe um draft para este paciente
    const { data: existing } = await supabase
      .from('draft_meal_plans')
      .select('id')
      .eq('patient_id', patientId)
      .maybeSingle();
    
    if (existing) {
      // Atualizar existente
      const { data, error } = await supabase
        .from('draft_meal_plans')
        .update({
          professional_id: professionalId,
          draft_data: draftPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar draft_meal_plan:', error);
      }
      return { data, error };
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('draft_meal_plans')
        .insert({
          patient_id: patientId,
          professional_id: professionalId,
          draft_data: draftPlan,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar draft_meal_plan:', error);
      }
      return { data, error };
    }
  } catch (err) {
    console.error('Erro em saveDraftMealPlan:', err);
    return { data: null, error: err };
  }
};

/**
 * Busca pré-plano do paciente
 */
export const getDraftMealPlan = async (patientId) => {
  const { data, error } = await supabase
    .from('draft_meal_plans')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();
  return { data, error };
};

/**
 * Atualiza pré-plano (quando profissional edita)
 */
export const updateDraftMealPlan = async (patientId, updates) => {
  const { data, error } = await supabase
    .from('draft_meal_plans')
    .update({
      draft_data: updates,
      updated_at: new Date().toISOString()
    })
    .eq('patient_id', patientId)
    .select()
    .single();
  return { data, error };
};

/**
 * Cria dicas automáticas baseadas no pré-plano
 */
export const createAutomaticTips = async (patientId, professionalId, tips) => {
  const tipsToInsert = tips.map(tip => ({
    patient_id: patientId,
    professional_id: professionalId,
    title: tip.title,
    content: tip.content,
    category: 'nutrition',
    is_active: true,
    auto_generated: true
  }));

  const { data, error } = await supabase
    .from('tips')
    .insert(tipsToInsert)
    .select();
  
  return { data, error };
};

// Criar dica personalizada especial (fica destacada no topo)
export const createPersonalizedTip = async (patientId, professionalId, personalizedTip) => {
  try {
    // Primeiro, desativar dicas personalizadas antigas deste paciente
    await supabase
      .from('tips')
      .update({ is_active: false })
      .eq('patient_id', patientId)
      .eq('category', 'personalized');
    
    // Criar nova dica personalizada
    const { data, error } = await supabase
      .from('tips')
      .insert({
        patient_id: patientId,
        professional_id: professionalId,
        title: personalizedTip.title,
        content: personalizedTip.content,
        category: 'personalized',
        is_active: true,
        auto_generated: true,
        is_pinned: true // Fica fixada no topo
      })
      .select()
      .single();
    
    return { data, error };
  } catch (err) {
    console.error('Erro ao criar dica personalizada:', err);
    return { data: null, error: err };
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
  
  const { data, error } = await query.maybeSingle();
  return { data, error };
};

export const createMealPlan = async (planData) => {
  try {
    console.log('🔍 createMealPlan - Dados recebidos:', {
      patient_id: planData.patient_id,
      professional_id: planData.professional_id,
      name: planData.name,
      has_plan_data: !!planData.plan_data,
      meals_count: planData.plan_data?.meals?.length,
      has_daily_targets: !!planData.daily_targets
    });

    // Verificar se já existe um plano ativo para este paciente
    const { data: existingList, error: selectError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('patient_id', planData.patient_id)
      .eq('is_active', true)
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro ao verificar plano existente');
      console.error('Message:', selectError?.message || 'Sem mensagem');
      
      return { 
        data: null, 
        error: { 
          message: selectError?.message || selectError?.msg || 'Erro ao verificar plano existente',
          code: selectError?.code || '',
          type: 'select_error'
        } 
      };
    }
    
    const existing = existingList && existingList.length > 0 ? existingList[0] : null;
    
    if (existing) {
      console.log('♻️ Plano existente encontrado, atualizando:', existing.id);
      // Atualizar plano existente
      const updateData = {
        name: planData.name,
        plan_data: planData.plan_data || { meals: [] },
        daily_targets: planData.daily_targets || { calorias: 2000, proteina: 100, carboidrato: 250, gordura: 70 },
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 Dados do UPDATE:', updateData);
      
      const { data: updatedList, error } = await supabase
        .from('meal_plans')
        .update(updateData)
        .eq('id', existing.id)
        .select();
      
      if (error) {
        console.error('❌ Erro ao atualizar plano existente');
        console.error('Message:', error?.message || 'Sem mensagem');
        console.error('Code:', error?.code || 'Sem código');
        
        const cleanError = {
          message: error?.message || error?.msg || 'Erro ao atualizar plano',
          code: error?.code || '',
          type: 'update_error'
        };
        
        return { 
          data: null, 
          error: cleanError
        };
      }
      
      const data = updatedList && updatedList.length > 0 ? updatedList[0] : null;
      console.log('✅ Plano atualizado com sucesso:', data?.id);
      return { data, error: null };
    }
    
    // Criar novo plano
    console.log('➕ Criando novo plano...');
    const insertData = {
      patient_id: planData.patient_id,
      professional_id: planData.professional_id,
      name: planData.name,
      plan_data: planData.plan_data || { meals: [] },
      daily_targets: planData.daily_targets || { calorias: 2000, proteina: 100, carboidrato: 250, gordura: 70 },
      is_active: planData.is_active !== undefined ? planData.is_active : true,
      description: planData.description || null,
      start_date: planData.start_date || null,
      end_date: planData.end_date || null
    };
    
    console.log('📝 Dados do INSERT:', {
      ...insertData,
      plan_data: `${insertData.plan_data.meals?.length || 0} refeições`,
      daily_targets: insertData.daily_targets
    });
    
    // Tentar insert com tratamento especial de erro
    let insertedList, error;
    try {
      const response = await supabase
        .from('meal_plans')
        .insert(insertData)
        .select();
      
      insertedList = response.data;
      error = response.error;
      
      // Se tiver erro, tentar ler o body da resposta HTTP
      if (error && !error.message) {
        console.error('⚠️ Erro sem mensagem, objeto error:', Object.keys(error));
      }
    } catch (insertError) {
      console.error('❌ Exceção durante insert:', insertError?.message || 'Erro desconhecido');
      error = {
        message: insertError?.message || 'Erro ao executar INSERT',
        code: 'EXCEPTION'
      };
    }
    
    if (error) {
      // NÃO logar error object - causa body stream already read
      console.error('❌ Erro ao criar novo plano');
      console.error('Message:', error?.message || 'Sem mensagem');
      console.error('Code:', error?.code || 'Sem código');
      
      // Criar novo error object limpo
      const cleanError = {
        message: error?.message || error?.msg || 'Erro ao criar plano',
        code: error?.code || '',
        type: 'create_error'
      };
      
      return { 
        data: null, 
        error: cleanError
      };
    }
    
    const data = insertedList && insertedList.length > 0 ? insertedList[0] : null;
    console.log('✅ Plano criado com sucesso:', data?.id);
    return { data, error: null };
  } catch (err) {
    console.error('❌ Erro inesperado em createMealPlan:', err);
    return { 
      data: null, 
      error: { 
        message: err?.message || 'Erro inesperado ao salvar plano',
        code: 'UNEXPECTED_ERROR',
        details: String(err)
      } 
    };
  }
};

export const updateMealPlan = async (planId, updates) => {
  try {
    const { data: updatedList, error } = await supabase
      .from('meal_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar plano:', error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Sem permissão para atualizar plano',
          code: error.code,
          details: error.details,
          hint: 'Verifique se você tem permissão para editar este plano'
        } 
      };
    }
    
    const data = updatedList && updatedList.length > 0 ? updatedList[0] : null;
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado em updateMealPlan:', err);
    return { 
      data: null, 
      error: { 
        message: err?.message || 'Erro inesperado ao atualizar',
        code: 'UNEXPECTED_ERROR',
        details: String(err)
      } 
    };
  }
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
    .maybeSingle();
  
  const { data: activePlan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .maybeSingle();
  
  const { data: anamnesis } = await supabase
    .from('anamnesis')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const adherence = await getChecklistAdherence(patientId, 7);
  
  return { profile, activePlan, anamnesis, adherence };
};

// ==================== BRANDING ====================

export const getBranding = async (userId) => {
  const { data, error } = await supabase
    .from('branding_configs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
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

// Menu COMPLETO padrão para pacientes (inclui todos os itens)
export const DEFAULT_PATIENT_MENU = [
  // Itens fixos (sempre no topo)
  { id: 'dashboard', name: 'Dashboard', icon: 'Home', route: '/patient/dashboard', visible: true, order: 1, fixed: true },
  { id: 'agenda', name: 'Minha Agenda', icon: 'Bell', route: '/patient/agenda', visible: true, order: 2, fixed: false },
  // Itens da seção "Meu Projeto"
  { id: 'meal-plan', name: 'Meu Plano', icon: 'Calendar', route: '/patient/meal-plan', visible: true, order: 3 },
  { id: 'avaliacao-fisica', name: 'Avaliação Física', icon: 'Activity', route: '/patient/avaliacao-fisica', visible: true, order: 4 },
  { id: 'tarefas', name: 'Minhas Tarefas', icon: 'ClipboardList', route: '/patient/tarefas', visible: true, order: 5 },
  { id: 'feedbacks', name: 'Meus Feedbacks', icon: 'MessageSquare', route: '/patient/feedbacks', visible: true, order: 6 },
  { id: 'receitas', name: 'Minhas Receitas', icon: 'ChefHat', route: '/patient/receitas', visible: true, order: 7 },
  { id: 'lista-compras', name: 'Lista de Compras', icon: 'ShoppingCart', route: '/patient/lista-compras', visible: true, order: 8 },
  { id: 'suplementos', name: 'Suplementos', icon: 'Pill', route: '/patient/suplementos', visible: true, order: 9 },
  { id: 'dicas', name: 'Dicas', icon: 'Lightbulb', route: '/patient/dicas', visible: true, order: 10 },
  { id: 'jornada', name: 'Minha Jornada', icon: 'TrendingUp', route: '/patient/jornada', visible: true, order: 11 },
  // Calculadoras
  { id: 'calculadoras', name: 'Calculadoras', icon: 'Calculator', route: '/patient/calculators', visible: true, order: 12 }
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

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (onlyUnread = false) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (onlyUnread) {
    query = query.eq('is_read', false);
  }
  
  const { data, error } = await query.limit(50);
  return { data, error };
};

export const getUnreadNotificationsCount = async () => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  return { count, error };
};

export const markNotificationAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();
  return { data, error };
};

export const markAllNotificationsAsRead = async () => {
  const user = await getCurrentUser();
  if (!user) return { error: { message: 'Não autenticado' } };
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false);
  return { error };
};

export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  return { error };
};

// ==================== RECIPES ====================

export const getRecipes = async (professionalId = null, includeAll = true) => {
  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Se includeAll for false, filtra apenas receitas do profissional
  // Se includeAll for true (padrão), busca todas as receitas que o profissional pode ver
  if (professionalId && !includeAll) {
    query = query.eq('professional_id', professionalId);
  }
  
  const { data, error } = await query;
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
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', recipeId)
    .select()
    .single();
  return { data, error };
};

export const deleteRecipe = async (recipeId) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId);
  return { error };
};

// ==================== TIPS ====================

export const getTips = async (professionalId = null) => {
  let query = supabase
    .from('tips')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (professionalId) {
    query = query.eq('professional_id', professionalId);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const createTip = async (tipData) => {
  const { data, error } = await supabase
    .from('tips')
    .insert(tipData)
    .select()
    .single();
  return { data, error };
};

export const updateTip = async (tipId, updates) => {
  const { data, error } = await supabase
    .from('tips')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', tipId)
    .select()
    .single();
  return { data, error };
};

export const deleteTip = async (tipId) => {
  const { error } = await supabase
    .from('tips')
    .delete()
    .eq('id', tipId);
  return { error };
};

// ==================== SUPPLEMENTS ====================

export const getSupplements = async (professionalId = null) => {
  let query = supabase
    .from('supplements')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (professionalId) {
    query = query.eq('professional_id', professionalId);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const createSupplement = async (supplementData) => {
  const { data, error } = await supabase
    .from('supplements')
    .insert(supplementData)
    .select()
    .single();
  return { data, error };
};

export const updateSupplement = async (supplementId, updates) => {
  const { data, error } = await supabase
    .from('supplements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', supplementId)
    .select()
    .single();
  return { data, error };
};

export const deleteSupplement = async (supplementId) => {
  const { error } = await supabase
    .from('supplements')
    .delete()
    .eq('id', supplementId);
  return { error };
};

// ==================== RECIPE VISIBILITY ====================

// Obter receitas visíveis para um paciente específico
export const getVisibleRecipesForPatient = async (patientId) => {
  try {
    // Primeiro, tentar usar a função do banco
    const { data, error } = await supabase
      .rpc('get_visible_recipes_for_patient', { p_patient_id: patientId });
    
    if (!error && data) {
      return { data, error: null };
    }
    
    // Fallback: buscar receitas globais ou com visibilidade
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_active', true)
      .or(`is_global.eq.true,visibility_mode.eq.all`);
    
    if (recipesError) {
      // Se falhar, buscar todas receitas ativas (fallback)
      const { data: allRecipes, error: allError } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_active', true);
      return { data: allRecipes, error: allError };
    }
    
    // Buscar receitas com visibilidade específica para este paciente
    const { data: visibility } = await supabase
      .from('recipe_patient_visibility')
      .select('recipe_id')
      .eq('patient_id', patientId)
      .eq('visible', true);
    
    const visibleIds = visibility?.map(v => v.recipe_id) || [];
    
    // Buscar receitas com visibilidade específica
    if (visibleIds.length > 0) {
      const { data: specificRecipes } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_active', true)
        .in('id', visibleIds);
      
      // Combinar receitas globais com específicas
      const allRecipes = [...(recipes || [])];
      specificRecipes?.forEach(r => {
        if (!allRecipes.find(ar => ar.id === r.id)) {
          allRecipes.push(r);
        }
      });
      return { data: allRecipes, error: null };
    }
    
    return { data: recipes, error: null };
  } catch (err) {
    console.error('Erro ao buscar receitas visíveis:', err);
    return { data: null, error: err };
  }
};

// Obter configuração de visibilidade de uma receita
export const getRecipeVisibility = async (recipeId) => {
  const { data, error } = await supabase
    .from('recipe_patient_visibility')
    .select(`
      *,
      patient:profiles!recipe_patient_visibility_patient_id_fkey(id, full_name, email)
    `)
    .eq('recipe_id', recipeId);
  return { data, error };
};

// Obter todas as visibilidades de um profissional
export const getRecipeVisibilityByProfessional = async (professionalId) => {
  const { data, error } = await supabase
    .from('recipe_patient_visibility')
    .select(`
      *,
      recipe:recipes(id, name, category),
      patient:profiles!recipe_patient_visibility_patient_id_fkey(id, full_name, email)
    `)
    .eq('professional_id', professionalId);
  return { data, error };
};

// Definir visibilidade de uma receita para um paciente
export const setRecipeVisibility = async (recipeId, patientId, professionalId, visible = true) => {
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('recipe_patient_visibility')
    .select('id')
    .eq('recipe_id', recipeId)
    .eq('patient_id', patientId)
    .maybeSingle();
  
  if (existing) {
    // Atualizar
    const { data, error } = await supabase
      .from('recipe_patient_visibility')
      .update({ visible, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    // Criar novo
    const { data, error } = await supabase
      .from('recipe_patient_visibility')
      .insert({
        recipe_id: recipeId,
        patient_id: patientId,
        professional_id: professionalId,
        visible
      })
      .select()
      .single();
    return { data, error };
  }
};

// Definir visibilidade de uma receita para múltiplos pacientes
export const setRecipeVisibilityBulk = async (recipeId, patientIds, professionalId, visible = true) => {
  const results = [];
  for (const patientId of patientIds) {
    const result = await setRecipeVisibility(recipeId, patientId, professionalId, visible);
    results.push(result);
  }
  return results;
};

// Remover visibilidade de uma receita para um paciente
export const removeRecipeVisibility = async (recipeId, patientId) => {
  const { error } = await supabase
    .from('recipe_patient_visibility')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('patient_id', patientId);
  return { error };
};

// Atualizar modo de visibilidade da receita
export const updateRecipeVisibilityMode = async (recipeId, mode) => {
  // mode: 'all' | 'selected' | 'none'
  const { data, error } = await supabase
    .from('recipes')
    .update({ visibility_mode: mode, updated_at: new Date().toISOString() })
    .eq('id', recipeId)
    .select()
    .single();
  return { data, error };
};

// Obter pacientes que podem ver uma receita
export const getPatientsWithRecipeAccess = async (recipeId) => {
  const { data, error } = await supabase
    .from('recipe_patient_visibility')
    .select(`
      patient_id,
      visible,
      patient:profiles!recipe_patient_visibility_patient_id_fkey(id, full_name, email)
    `)
    .eq('recipe_id', recipeId)
    .eq('visible', true);
  return { data, error };
};

// ==================== AGENDA / CALENDAR EVENTS ====================

export const getCalendarEvents = async (userId, startDate = null, endDate = null) => {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .or(`patient_id.eq.${userId},professional_id.eq.${userId}`)
    .order('event_date', { ascending: true });
  
  if (startDate) {
    query = query.gte('event_date', startDate);
  }
  if (endDate) {
    query = query.lte('event_date', endDate);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const createCalendarEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(eventData)
    .select()
    .single();
  return { data, error };
};

export const updateCalendarEvent = async (eventId, updates) => {
  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select()
    .single();
  return { data, error };
};

export const deleteCalendarEvent = async (eventId) => {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);
  return { error };
};

export const getCalendarEventsByPatient = async (patientId, startDate = null, endDate = null) => {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('patient_id', patientId)
    .order('event_date', { ascending: true });
  
  if (startDate) {
    query = query.gte('event_date', startDate);
  }
  if (endDate) {
    query = query.lte('event_date', endDate);
  }
  
  const { data, error } = await query;
  return { data, error };
};


// ==================== PHYSICAL ASSESSMENTS ====================

// Buscar todas as avaliações físicas de um paciente
export const getPhysicalAssessments = async (patientId) => {
  const { data, error } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('patient_id', patientId)
    .order('assessment_date', { ascending: false });
  return { data, error };
};

// Buscar última avaliação física
export const getLatestPhysicalAssessment = async (patientId) => {
  const { data, error } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('patient_id', patientId)
    .order('assessment_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
};

// Buscar avaliação específica
export const getPhysicalAssessmentById = async (assessmentId) => {
  const { data, error } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();
  return { data, error };
};

// Criar nova avaliação física
export const createPhysicalAssessment = async (assessmentData) => {
  // Calcular IMC se peso e altura foram fornecidos
  if (assessmentData.weight && assessmentData.height) {
    const heightInMeters = assessmentData.height / 100;
    assessmentData.bmi = (assessmentData.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  
  // Calcular relação cintura/quadril
  if (assessmentData.waist && assessmentData.hip) {
    assessmentData.waist_hip_ratio = (assessmentData.waist / assessmentData.hip).toFixed(3);
  }
  
  const { data, error } = await supabase
    .from('physical_assessments')
    .insert(assessmentData)
    .select()
    .single();
  return { data, error };
};

// Atualizar avaliação física
export const updatePhysicalAssessment = async (assessmentId, updates) => {
  // Recalcular IMC se peso ou altura mudaram
  if (updates.weight && updates.height) {
    const heightInMeters = updates.height / 100;
    updates.bmi = (updates.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  
  // Recalcular relação cintura/quadril
  if (updates.waist && updates.hip) {
    updates.waist_hip_ratio = (updates.waist / updates.hip).toFixed(3);
  }
  
  const { data, error } = await supabase
    .from('physical_assessments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', assessmentId)
    .select()
    .single();
  return { data, error };
};

// Deletar avaliação física
export const deletePhysicalAssessment = async (assessmentId) => {
  const { error } = await supabase
    .from('physical_assessments')
    .delete()
    .eq('id', assessmentId);
  return { error };
};

// Comparar duas avaliações (calcular diferenças)
export const compareAssessments = (current, previous) => {
  if (!current || !previous) return null;
  
  const fields = [
    'weight', 'bmi', 'body_fat_percentage', 'lean_mass', 'fat_mass',
    'waist', 'hip', 'arm_right', 'arm_left', 'thigh_right', 'thigh_left',
    'chest', 'abdomen', 'muscle_mass'
  ];
  
  const comparison = {};
  fields.forEach(field => {
    if (current[field] && previous[field]) {
      const diff = current[field] - previous[field];
      comparison[field] = {
        current: current[field],
        previous: previous[field],
        diff: diff.toFixed(2),
        percentage: ((diff / previous[field]) * 100).toFixed(1)
      };
    }
  });
  
  return comparison;
};
