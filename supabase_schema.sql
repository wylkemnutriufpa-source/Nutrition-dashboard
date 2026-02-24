-- ============================================
-- FITJOURNEY - SUPABASE DATABASE SCHEMA
-- Execute no Supabase SQL Editor
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- 2. TABELA PATIENT_PROFILES (Vínculo Paciente-Profissional)
-- ============================================
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
-- 4. TABELA BRANDING_CONFIGS (White-label)
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
-- 5. TRIGGER PARA AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_custom_foods_updated_at BEFORE UPDATE ON custom_foods
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_branding_configs_updated_at BEFORE UPDATE ON branding_configs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 6. FUNÇÃO PARA CRIAR PROFILE AO REGISTRAR
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
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_configs ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES POLICIES ====================

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

-- Usuários podem atualizar seu próprio profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ==================== PATIENT_PROFILES POLICIES ====================

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

-- ==================== BRANDING_CONFIGS POLICIES ====================

-- Usuários podem ver seu próprio branding
CREATE POLICY "Users can view own branding" ON branding_configs
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem criar seu branding
CREATE POLICY "Users can create own branding" ON branding_configs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seu branding
CREATE POLICY "Users can update own branding" ON branding_configs
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 8. DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Criar usuário admin global (execute depois de criar o usuário no Auth)
-- Substitua 'ADMIN_UUID' pelo UUID real do usuário admin criado no Supabase Auth
/*
INSERT INTO profiles (id, email, name, role)
VALUES ('ADMIN_UUID', 'admin@fitjourney.com', 'Administrador', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO branding_configs (user_id, user_type, brand_name, primary_color, accent_color)
VALUES (NULL, 'admin', 'FitJourney', '#0F766E', '#059669')
ON CONFLICT (user_id) DO NOTHING;
*/

-- ============================================
-- FIM DO SCHEMA
-- ============================================
