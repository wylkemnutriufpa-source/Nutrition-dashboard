-- ============================================
-- FITJOURNEY - SCHEMA ATUALIZADO (v2)
-- Execute no Supabase SQL Editor
-- REMOVE FK obrigatória de auth.users para permitir criação de pacientes sem login
-- ============================================

-- ============================================
-- 1. ALTERAR TABELA PROFILES
-- Remover a FK obrigatória e permitir NULL no id para pacientes criados pelo profissional
-- ============================================

-- Primeiro, dropar a constraint existente se existir
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recriar a tabela profiles sem a FK obrigatória
-- (Manter a estrutura mas sem referência a auth.users)

-- Se a tabela já existe, apenas alterar
-- Se não existe, criar nova

DO $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'professional', 'patient')),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            birth_date DATE,
            gender TEXT CHECK (gender IN ('male', 'female', 'other')),
            height NUMERIC,
            current_weight NUMERIC,
            goal_weight NUMERIC,
            goal TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Adicionar coluna auth_user_id se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_user_id') THEN
            ALTER TABLE profiles ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
        
        -- Adicionar colunas faltantes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_date') THEN
            ALTER TABLE profiles ADD COLUMN birth_date DATE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
            ALTER TABLE profiles ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'height') THEN
            ALTER TABLE profiles ADD COLUMN height NUMERIC;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_weight') THEN
            ALTER TABLE profiles ADD COLUMN current_weight NUMERIC;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goal_weight') THEN
            ALTER TABLE profiles ADD COLUMN goal_weight NUMERIC;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goal') THEN
            ALTER TABLE profiles ADD COLUMN goal TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
            ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notes') THEN
            ALTER TABLE profiles ADD COLUMN notes TEXT;
        END IF;
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);

-- ============================================
-- 2. ATUALIZAR FUNÇÃO DE CRIAÇÃO DE PROFILE
-- Agora usa auth_user_id em vez de id
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_profile UUID;
BEGIN
    -- Verificar se já existe um profile com este email
    SELECT id INTO existing_profile FROM public.profiles WHERE email = NEW.email;
    
    IF existing_profile IS NOT NULL THEN
        -- Atualizar o profile existente com o auth_user_id
        UPDATE public.profiles 
        SET auth_user_id = NEW.id,
            name = COALESCE(NEW.raw_user_meta_data->>'name', name)
        WHERE id = existing_profile;
    ELSE
        -- Criar novo profile
        INSERT INTO public.profiles (id, auth_user_id, email, name, role)
        VALUES (
            gen_random_uuid(),
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'role', 'professional')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. TABELA PATIENT_PROFILES (se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_patient ON patient_profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_professional ON patient_profiles(professional_id);

-- ============================================
-- 4. TABELA MEAL_PLANS (se não existir)
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

CREATE INDEX IF NOT EXISTS idx_meal_plans_patient ON meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_professional ON meal_plans(professional_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_active ON meal_plans(is_active);

-- ============================================
-- 5. TABELA CUSTOM_FOODS (se não existir)
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
-- 6. TABELA ANAMNESIS (se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conditions JSONB DEFAULT '[]',
    allergies TEXT[],
    medications TEXT[],
    medical_history TEXT,
    family_history TEXT,
    physical_activity TEXT,
    sleep_hours NUMERIC,
    water_intake NUMERIC,
    alcohol_consumption TEXT,
    smoking TEXT,
    food_preferences TEXT,
    food_restrictions TEXT,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_patient ON anamnesis(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_professional ON anamnesis(professional_id);

-- ============================================
-- 7. TABELA BRANDING_CONFIGS (se não existir)
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
-- 8. TRIGGERS DE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_foods_updated_at ON custom_foods;
CREATE TRIGGER update_custom_foods_updated_at BEFORE UPDATE ON custom_foods
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_anamnesis_updated_at ON anamnesis;
CREATE TRIGGER update_anamnesis_updated_at BEFORE UPDATE ON anamnesis
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_branding_configs_updated_at ON branding_configs;
CREATE TRIGGER update_branding_configs_updated_at BEFORE UPDATE ON branding_configs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_configs ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES POLICIES ====================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Professionals can view their patients" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Professionals can insert patients" ON profiles;
DROP POLICY IF EXISTS "Professionals can update their patients" ON profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;

-- Usuários podem ver seu próprio profile (via auth_user_id)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth_user_id = auth.uid() OR id = auth.uid());

-- Profissionais podem ver profiles de seus pacientes
CREATE POLICY "Professionals can view their patients" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patient_profiles pp
            JOIN profiles prof ON prof.id = pp.professional_id
            WHERE (prof.auth_user_id = auth.uid() OR prof.id = auth.uid())
            AND pp.patient_id = profiles.id
        )
    );

-- Profissionais podem criar pacientes
CREATE POLICY "Professionals can insert patients" ON profiles
    FOR INSERT WITH CHECK (
        role = 'patient'
    );

-- Usuários podem atualizar seu próprio profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth_user_id = auth.uid() OR id = auth.uid());

-- Profissionais podem atualizar profiles de seus pacientes
CREATE POLICY "Professionals can update their patients" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM patient_profiles pp
            JOIN profiles prof ON prof.id = pp.professional_id
            WHERE (prof.auth_user_id = auth.uid() OR prof.id = auth.uid())
            AND pp.patient_id = profiles.id
        )
    );

-- ==================== PATIENT_PROFILES POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view their patient links" ON patient_profiles;
DROP POLICY IF EXISTS "Patients can view their links" ON patient_profiles;
DROP POLICY IF EXISTS "Professionals can create patient links" ON patient_profiles;
DROP POLICY IF EXISTS "Professionals can delete their patient links" ON patient_profiles;
DROP POLICY IF EXISTS "Admin full access patient_profiles" ON patient_profiles;

-- Profissionais podem ver seus vínculos
CREATE POLICY "Professionals can view their patient links" ON patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = patient_profiles.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Pacientes podem ver seus vínculos
CREATE POLICY "Patients can view their links" ON patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = patient_profiles.patient_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissionais podem criar vínculos
CREATE POLICY "Professionals can create patient links" ON patient_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = patient_profiles.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
            AND p.role = 'professional'
        )
    );

-- Profissionais podem deletar seus vínculos
CREATE POLICY "Professionals can delete their patient links" ON patient_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = patient_profiles.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- ==================== MEAL_PLANS POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view their patients meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can create meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can update their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can delete their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can view their own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Admin full access meal_plans" ON meal_plans;

-- Profissional pode ver planos que criou
CREATE POLICY "Professionals can view their patients meal plans" ON meal_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = meal_plans.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissional pode criar planos
CREATE POLICY "Professionals can create meal plans" ON meal_plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = meal_plans.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissional pode atualizar seus planos
CREATE POLICY "Professionals can update their meal plans" ON meal_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = meal_plans.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissional pode deletar seus planos
CREATE POLICY "Professionals can delete their meal plans" ON meal_plans
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = meal_plans.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Paciente pode ver seus próprios planos
CREATE POLICY "Patients can view their own meal plans" ON meal_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = meal_plans.patient_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- ==================== CUSTOM_FOODS POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view own foods" ON custom_foods;
DROP POLICY IF EXISTS "Professionals can create foods" ON custom_foods;
DROP POLICY IF EXISTS "Professionals can update own foods" ON custom_foods;
DROP POLICY IF EXISTS "Professionals can delete own foods" ON custom_foods;
DROP POLICY IF EXISTS "Admin full access custom_foods" ON custom_foods;

-- Profissionais veem apenas seus alimentos
CREATE POLICY "Professionals can view own foods" ON custom_foods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = custom_foods.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissionais podem criar seus alimentos
CREATE POLICY "Professionals can create foods" ON custom_foods
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = custom_foods.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissionais podem atualizar seus alimentos
CREATE POLICY "Professionals can update own foods" ON custom_foods
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = custom_foods.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissionais podem deletar seus alimentos
CREATE POLICY "Professionals can delete own foods" ON custom_foods
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = custom_foods.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- ==================== ANAMNESIS POLICIES ====================

DROP POLICY IF EXISTS "Professionals can view anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Professionals can create anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Professionals can update anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Professionals can delete anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Patients can view own anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Admin full access anamnesis" ON anamnesis;

-- Profissionais podem ver anamneses que criaram
CREATE POLICY "Professionals can view anamnesis" ON anamnesis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = anamnesis.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissionais podem criar anamneses
CREATE POLICY "Professionals can create anamnesis" ON anamnesis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = anamnesis.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Profissionais podem atualizar suas anamneses
CREATE POLICY "Professionals can update anamnesis" ON anamnesis
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = anamnesis.professional_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Pacientes podem ver sua própria anamnese
CREATE POLICY "Patients can view own anamnesis" ON anamnesis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = anamnesis.patient_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- ==================== BRANDING_CONFIGS POLICIES ====================

DROP POLICY IF EXISTS "Users can view own branding" ON branding_configs;
DROP POLICY IF EXISTS "Users can create own branding" ON branding_configs;
DROP POLICY IF EXISTS "Users can update own branding" ON branding_configs;
DROP POLICY IF EXISTS "Admin full access branding_configs" ON branding_configs;

-- Usuários podem ver seu próprio branding
CREATE POLICY "Users can view own branding" ON branding_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = branding_configs.user_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Usuários podem criar seu branding
CREATE POLICY "Users can create own branding" ON branding_configs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = branding_configs.user_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- Usuários podem atualizar seu branding
CREATE POLICY "Users can update own branding" ON branding_configs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = branding_configs.user_id 
            AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    );

-- ============================================
-- FIM DO SCHEMA v2
-- ============================================
