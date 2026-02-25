-- ============================================
-- FITJOURNEY - SCHEMA COMPLETO PARA SUPABASE
-- Execute no Supabase SQL Editor
-- INCLUI TODAS AS TABELAS E POLÍTICAS RLS
-- ============================================

-- ============================================
-- 1. TABELA PROFILES (Perfis de usuário)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'professional', 'patient')),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    -- Campos adicionais para pacientes
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height NUMERIC, -- em cm
    current_weight NUMERIC, -- em kg
    goal_weight NUMERIC, -- em kg
    goal TEXT, -- objetivo (emagrecimento, ganho de massa, etc)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT, -- observações gerais
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ============================================
-- 2. TABELA PATIENT_PROFILES (Vínculo Paciente-Profissional)
-- ============================================
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, professional_id)
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_patient_profiles_patient ON patient_profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_professional ON patient_profiles(professional_id);

-- ============================================
-- 3. TABELA CUSTOM_FOODS (Alimentos customizados)
-- ============================================
CREATE TABLE IF NOT EXISTS custom_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source TEXT DEFAULT 'CUSTOM',
    source_id TEXT,
    porcao NUMERIC NOT NULL DEFAULT 100,
    unidade TEXT NOT NULL DEFAULT 'g',
    calorias NUMERIC NOT NULL DEFAULT 0,
    proteina NUMERIC NOT NULL DEFAULT 0,
    carboidrato NUMERIC NOT NULL DEFAULT 0,
    gordura NUMERIC NOT NULL DEFAULT 0,
    fibra NUMERIC DEFAULT 0,
    sodio NUMERIC DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_foods_professional ON custom_foods(professional_id);

-- ============================================
-- 4. TABELA MEAL_PLANS (Planos Alimentares)
-- ============================================
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Plano Alimentar',
    description TEXT,
    plan_data JSONB NOT NULL DEFAULT '{"meals": []}',
    daily_targets JSONB DEFAULT '{"calorias": 2000, "proteina": 100, "carboidrato": 250, "gordura": 70}',
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_patient ON meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_professional ON meal_plans(professional_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_active ON meal_plans(is_active);

-- ============================================
-- 5. TABELA BRANDING_CONFIGS (White-label)
-- ============================================
CREATE TABLE IF NOT EXISTS branding_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    user_type TEXT CHECK (user_type IN ('admin', 'professional')),
    logo TEXT,
    brand_name TEXT NOT NULL DEFAULT 'FitJourney',
    primary_color TEXT NOT NULL DEFAULT '#0F766E',
    accent_color TEXT NOT NULL DEFAULT '#059669',
    footer_text TEXT DEFAULT 'Sua jornada para uma vida mais saudável',
    welcome_message TEXT DEFAULT 'Bem-vindo ao seu painel de nutrição',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branding_user ON branding_configs(user_id);

-- ============================================
-- 6. TABELA ANAMNESIS (Anamnese do paciente)
-- ============================================
CREATE TABLE IF NOT EXISTS anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- Condições médicas
    conditions JSONB DEFAULT '[]', -- [{condition: 'Diabetes', alert: 'Controlar...'}]
    allergies TEXT[],
    medications TEXT[],
    -- Histórico
    medical_history TEXT,
    family_history TEXT,
    -- Hábitos
    physical_activity TEXT,
    sleep_hours NUMERIC,
    water_intake NUMERIC, -- litros/dia
    alcohol_consumption TEXT,
    smoking TEXT,
    -- Preferências alimentares
    food_preferences TEXT,
    food_restrictions TEXT,
    -- Outros
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_patient ON anamnesis(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_professional ON anamnesis(professional_id);

-- ============================================
-- 7. TRIGGER PARA AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_custom_foods_updated_at') THEN
        CREATE TRIGGER update_custom_foods_updated_at BEFORE UPDATE ON custom_foods
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_meal_plans_updated_at') THEN
        CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_branding_configs_updated_at') THEN
        CREATE TRIGGER update_branding_configs_updated_at BEFORE UPDATE ON branding_configs
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_anamnesis_updated_at') THEN
        CREATE TRIGGER update_anamnesis_updated_at BEFORE UPDATE ON anamnesis
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 8. FUNÇÃO PARA CRIAR PROFILE AO REGISTRAR
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'professional')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES POLICIES ====================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Professionals can view their patients" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
DROP POLICY IF EXISTS "Professionals can insert patients" ON profiles;

-- Admin pode ver tudo
CREATE POLICY "Admin full access profiles" ON profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Todos podem ver seus próprios profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Profissionais podem ver profiles de seus pacientes
CREATE POLICY "Professionals can view their patients" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patient_profiles pp
            WHERE pp.professional_id = auth.uid()
            AND pp.patient_id = profiles.id
        )
    );

-- Profissionais podem criar pacientes (insert na tabela profiles)
CREATE POLICY "Professionals can insert patients" ON profiles
    FOR INSERT WITH CHECK (
        role = 'patient' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'professional')
    );

-- Usuários podem atualizar seu próprio profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Profissionais podem atualizar profiles de seus pacientes
CREATE POLICY "Professionals can update their patients" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM patient_profiles pp
            WHERE pp.professional_id = auth.uid()
            AND pp.patient_id = profiles.id
        )
    );

-- ==================== PATIENT_PROFILES POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view their patient links" ON patient_profiles;
DROP POLICY IF EXISTS "Patients can view their links" ON patient_profiles;
DROP POLICY IF EXISTS "Professionals can create patient links" ON patient_profiles;
DROP POLICY IF EXISTS "Professionals can delete their patient links" ON patient_profiles;
DROP POLICY IF EXISTS "Admin full access patient_profiles" ON patient_profiles;

-- Admin pode ver tudo
CREATE POLICY "Admin full access patient_profiles" ON patient_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Profissionais podem ver seus vínculos
CREATE POLICY "Professionals can view their patient links" ON patient_profiles
    FOR SELECT USING (professional_id = auth.uid());

-- Pacientes podem ver seus vínculos
CREATE POLICY "Patients can view their links" ON patient_profiles
    FOR SELECT USING (patient_id = auth.uid());

-- Profissionais podem criar vínculos
CREATE POLICY "Professionals can create patient links" ON patient_profiles
    FOR INSERT WITH CHECK (
        professional_id = auth.uid() AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'professional')
    );

-- Profissionais podem deletar seus vínculos
CREATE POLICY "Professionals can delete their patient links" ON patient_profiles
    FOR DELETE USING (professional_id = auth.uid());

-- ==================== CUSTOM_FOODS POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view own foods" ON custom_foods;
DROP POLICY IF EXISTS "Professionals can create foods" ON custom_foods;
DROP POLICY IF EXISTS "Professionals can update own foods" ON custom_foods;
DROP POLICY IF EXISTS "Professionals can delete own foods" ON custom_foods;
DROP POLICY IF EXISTS "Admin full access custom_foods" ON custom_foods;

-- Admin pode ver tudo
CREATE POLICY "Admin full access custom_foods" ON custom_foods
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Profissionais veem apenas seus alimentos
CREATE POLICY "Professionals can view own foods" ON custom_foods
    FOR SELECT USING (professional_id = auth.uid());

-- Profissionais podem criar seus alimentos
CREATE POLICY "Professionals can create foods" ON custom_foods
    FOR INSERT WITH CHECK (professional_id = auth.uid());

-- Profissionais podem atualizar seus alimentos
CREATE POLICY "Professionals can update own foods" ON custom_foods
    FOR UPDATE USING (professional_id = auth.uid());

-- Profissionais podem deletar seus alimentos
CREATE POLICY "Professionals can delete own foods" ON custom_foods
    FOR DELETE USING (professional_id = auth.uid());

-- ==================== MEAL_PLANS POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view their patients meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can create meal plans for their patients" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can update their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can delete their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can view their own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Admin full access meal_plans" ON meal_plans;

-- Admin pode ver tudo
CREATE POLICY "Admin full access meal_plans" ON meal_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Profissional pode ver planos de seus pacientes
CREATE POLICY "Professionals can view their patients meal plans" ON meal_plans
    FOR SELECT USING (professional_id = auth.uid());

-- Profissional pode criar planos para seus pacientes
CREATE POLICY "Professionals can create meal plans" ON meal_plans
    FOR INSERT WITH CHECK (professional_id = auth.uid());

-- Profissional pode atualizar seus planos
CREATE POLICY "Professionals can update their meal plans" ON meal_plans
    FOR UPDATE USING (professional_id = auth.uid());

-- Profissional pode deletar seus planos
CREATE POLICY "Professionals can delete their meal plans" ON meal_plans
    FOR DELETE USING (professional_id = auth.uid());

-- Paciente pode ver seus próprios planos
CREATE POLICY "Patients can view their own meal plans" ON meal_plans
    FOR SELECT USING (patient_id = auth.uid());

-- ==================== BRANDING_CONFIGS POLICIES ====================

DROP POLICY IF EXISTS "Users can view own branding" ON branding_configs;
DROP POLICY IF EXISTS "Users can create own branding" ON branding_configs;
DROP POLICY IF EXISTS "Users can update own branding" ON branding_configs;
DROP POLICY IF EXISTS "Admin full access branding_configs" ON branding_configs;

-- Admin pode ver tudo
CREATE POLICY "Admin full access branding_configs" ON branding_configs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Usuários podem ver seu próprio branding
CREATE POLICY "Users can view own branding" ON branding_configs
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem criar seu branding
CREATE POLICY "Users can create own branding" ON branding_configs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seu branding
CREATE POLICY "Users can update own branding" ON branding_configs
    FOR UPDATE USING (user_id = auth.uid());

-- ==================== ANAMNESIS POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Professionals can create anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Professionals can update anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Professionals can delete anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Patients can view own anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Admin full access anamnesis" ON anamnesis;

-- Admin pode ver tudo
CREATE POLICY "Admin full access anamnesis" ON anamnesis
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Profissionais podem ver anamneses de seus pacientes
CREATE POLICY "Professionals can view anamnesis" ON anamnesis
    FOR SELECT USING (professional_id = auth.uid());

-- Profissionais podem criar anamneses
CREATE POLICY "Professionals can create anamnesis" ON anamnesis
    FOR INSERT WITH CHECK (professional_id = auth.uid());

-- Profissionais podem atualizar suas anamneses
CREATE POLICY "Professionals can update anamnesis" ON anamnesis
    FOR UPDATE USING (professional_id = auth.uid());

-- Profissionais podem deletar suas anamneses
CREATE POLICY "Professionals can delete anamnesis" ON anamnesis
    FOR DELETE USING (professional_id = auth.uid());

-- Pacientes podem ver sua própria anamnese
CREATE POLICY "Patients can view own anamnesis" ON anamnesis
    FOR SELECT USING (patient_id = auth.uid());

-- ============================================
-- 10. FUNÇÕES HELPER
-- ============================================

-- Função para obter plano ativo do paciente
CREATE OR REPLACE FUNCTION get_active_meal_plan(p_patient_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    plan_data JSONB,
    daily_targets JSONB,
    professional_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.id,
        mp.name,
        mp.description,
        mp.plan_data,
        mp.daily_targets,
        mp.professional_id,
        mp.created_at,
        mp.updated_at
    FROM meal_plans mp
    WHERE mp.patient_id = p_patient_id
    AND mp.is_active = TRUE
    ORDER BY mp.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar paciente (usado pelo profissional)
CREATE OR REPLACE FUNCTION create_patient_for_professional(
    p_professional_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_height NUMERIC DEFAULT NULL,
    p_current_weight NUMERIC DEFAULT NULL,
    p_goal_weight NUMERIC DEFAULT NULL,
    p_goal TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_patient_id UUID;
BEGIN
    -- Gerar novo UUID para o paciente
    v_patient_id := gen_random_uuid();
    
    -- Inserir na tabela profiles
    INSERT INTO profiles (id, email, name, phone, role, birth_date, gender, height, current_weight, goal_weight, goal, notes)
    VALUES (v_patient_id, p_email, p_name, p_phone, 'patient', p_birth_date, p_gender, p_height, p_current_weight, p_goal_weight, p_goal, p_notes);
    
    -- Criar vínculo com profissional
    INSERT INTO patient_profiles (patient_id, professional_id)
    VALUES (v_patient_id, p_professional_id);
    
    RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
