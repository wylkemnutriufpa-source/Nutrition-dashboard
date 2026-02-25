-- ============================================
-- FITJOURNEY - SCHEMA COMPLETO TAREFA 3
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. REMOVER FK CONSTRAINT se existir
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Garantir colunas em profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_user_id') THEN
        ALTER TABLE profiles ADD COLUMN auth_user_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_date') THEN
        ALTER TABLE profiles ADD COLUMN birth_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE profiles ADD COLUMN gender TEXT;
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notes') THEN
        ALTER TABLE profiles ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Tabela patient_profiles (vínculo paciente-profissional)
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, professional_id)
);

-- 4. Tabela meal_plans
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

-- 5. Tabela custom_foods
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

-- 6. Tabela anamnesis (COMPLETA - clínica e esportiva)
DROP TABLE IF EXISTS anamnesis CASCADE;
CREATE TABLE anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'draft', 'complete')),
    
    -- DADOS PESSOAIS
    occupation TEXT,
    marital_status TEXT,
    
    -- HISTÓRICO MÉDICO
    medical_conditions JSONB DEFAULT '[]', -- [{condition, since, treatment, controlled}]
    surgeries JSONB DEFAULT '[]', -- [{name, year, complications}]
    allergies TEXT[],
    food_intolerances TEXT[],
    medications JSONB DEFAULT '[]', -- [{name, dosage, frequency, reason}]
    supplements JSONB DEFAULT '[]', -- [{name, dosage, frequency}]
    family_history JSONB DEFAULT '[]', -- [{condition, relative}]
    
    -- EXAMES RECENTES
    recent_exams JSONB DEFAULT '[]', -- [{name, date, result, observation}]
    
    -- HÁBITOS DE VIDA
    smoking TEXT, -- 'never', 'former', 'current'
    smoking_details TEXT,
    alcohol TEXT, -- 'never', 'social', 'regular', 'daily'
    alcohol_details TEXT,
    sleep_hours NUMERIC,
    sleep_quality TEXT, -- 'good', 'regular', 'poor', 'insomnia'
    stress_level TEXT, -- 'low', 'moderate', 'high', 'very_high'
    
    -- ATIVIDADE FÍSICA
    physical_activity_level TEXT, -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
    exercise_types JSONB DEFAULT '[]', -- [{type, frequency, duration, intensity}]
    physical_limitations TEXT,
    
    -- HISTÓRICO ALIMENTAR
    meals_per_day INTEGER,
    meal_times JSONB DEFAULT '[]', -- [{meal, time}]
    water_intake NUMERIC, -- litros/dia
    food_preferences TEXT,
    food_aversions TEXT,
    dietary_restrictions TEXT,
    previous_diets TEXT,
    eating_disorders_history TEXT,
    
    -- OBJETIVOS
    main_goal TEXT,
    secondary_goals TEXT[],
    motivation TEXT,
    deadline TEXT,
    
    -- MEDIDAS CORPORAIS (pode ser atualizado)
    measurements JSONB DEFAULT '{}', -- {waist, hip, arm, thigh, chest, etc}
    body_fat_percentage NUMERIC,
    muscle_mass NUMERIC,
    
    -- SINTOMAS GASTROINTESTINAIS
    gi_symptoms JSONB DEFAULT '[]', -- [{symptom, frequency, trigger}]
    bowel_frequency TEXT,
    bowel_consistency TEXT,
    
    -- OBSERVAÇÕES
    professional_notes TEXT,
    patient_notes TEXT,
    
    -- CONTROLE
    last_edited_by TEXT, -- 'professional' ou 'patient'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela checklist_templates (templates de tarefas definidos pelo profissional)
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'nutrition', 'exercise', 'hydration', 'supplement', 'general'
    icon TEXT DEFAULT 'check',
    frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'specific_days'
    specific_days INTEGER[], -- [0,1,2,3,4,5,6] para dias específicos (0=domingo)
    time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'anytime'
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela checklist_entries (marcações diárias do paciente)
CREATE TABLE IF NOT EXISTS checklist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, patient_id, date)
);

-- 9. Tabela patient_messages (recados/dicas do profissional para o paciente)
CREATE TABLE IF NOT EXISTS patient_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'tip', -- 'tip', 'reminder', 'alert', 'motivation', 'feedback'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
    is_pinned BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabela branding_configs
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

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_patient ON patient_profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_professional ON patient_profiles(professional_id);

CREATE INDEX IF NOT EXISTS idx_meal_plans_patient ON meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_professional ON meal_plans(professional_id);

CREATE INDEX IF NOT EXISTS idx_anamnesis_patient ON anamnesis(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_professional ON anamnesis(professional_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_status ON anamnesis(status);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_patient ON checklist_templates(patient_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_professional ON checklist_templates(professional_id);

CREATE INDEX IF NOT EXISTS idx_checklist_entries_patient ON checklist_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_checklist_entries_date ON checklist_entries(date);
CREATE INDEX IF NOT EXISTS idx_checklist_entries_template ON checklist_entries(template_id);

CREATE INDEX IF NOT EXISTS idx_patient_messages_patient ON patient_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_professional ON patient_messages(professional_id);

-- 12. Trigger para updated_at
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

DROP TRIGGER IF EXISTS update_anamnesis_updated_at ON anamnesis;
CREATE TRIGGER update_anamnesis_updated_at BEFORE UPDATE ON anamnesis
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklist_templates_updated_at ON checklist_templates;
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON checklist_templates
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_messages_updated_at ON patient_messages;
CREATE TRIGGER update_patient_messages_updated_at BEFORE UPDATE ON patient_messages
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 13. Função para handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_profile_id UUID;
BEGIN
    SELECT id INTO existing_profile_id FROM public.profiles WHERE email = NEW.email;
    
    IF existing_profile_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET auth_user_id = NEW.id
        WHERE id = existing_profile_id;
    ELSE
        INSERT INTO public.profiles (id, auth_user_id, email, name, role, status)
        VALUES (
            NEW.id,
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'role', 'professional'),
            'active'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Configurar Admin
UPDATE profiles 
SET role = 'admin', status = 'active', name = COALESCE(name, 'Administrador')
WHERE email = 'wylkem.nutri.ufpa@gmail.com';

INSERT INTO profiles (id, email, name, role, status)
SELECT gen_random_uuid(), 'wylkem.nutri.ufpa@gmail.com', 'Administrador', 'admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'wylkem.nutri.ufpa@gmail.com');

-- Vincular ao auth.users
UPDATE profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE p.email = u.email AND p.auth_user_id IS NULL;

-- 15. Desabilitar RLS (simplifica o desenvolvimento)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE branding_configs DISABLE ROW LEVEL SECURITY;

-- 16. Verificar resultado
SELECT id, email, name, role, status, auth_user_id FROM profiles WHERE email = 'wylkem.nutri.ufpa@gmail.com';

-- ============================================
-- FIM DO SCHEMA
-- ============================================
