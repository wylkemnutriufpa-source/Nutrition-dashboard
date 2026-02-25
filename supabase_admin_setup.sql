-- ============================================
-- FITJOURNEY - SQL PARA CONFIGURAR ADMIN
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar colunas se não existirem
DO $$
BEGIN
    -- Adicionar auth_user_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_user_id') THEN
        ALTER TABLE profiles ADD COLUMN auth_user_id UUID;
    END IF;
    
    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    -- Adicionar campos de paciente se não existirem
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
END $$;

-- 2. Verificar/Criar tabela patient_profiles
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, professional_id)
);

-- 3. Verificar/Criar tabela meal_plans
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

-- 4. Configurar o usuário admin
-- (Substitua pelo ID do usuário no auth.users se necessário)
UPDATE profiles 
SET role = 'admin', status = 'active'
WHERE email = 'wylkem.nutri.ufpa@gmail.com';

-- 5. Se o profile não existe, criar
INSERT INTO profiles (id, email, name, role, status)
SELECT 
    gen_random_uuid(),
    'wylkem.nutri.ufpa@gmail.com',
    'Administrador',
    'admin',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'wylkem.nutri.ufpa@gmail.com'
);

-- 6. Vincular ao auth.users se existir
UPDATE profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE p.email = u.email
AND p.auth_user_id IS NULL;

-- 7. Atualizar função de criação de profile para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_profile_id UUID;
BEGIN
    -- Verificar se já existe um profile com este email
    SELECT id INTO existing_profile_id FROM public.profiles WHERE email = NEW.email;
    
    IF existing_profile_id IS NOT NULL THEN
        -- Atualizar o profile existente com o auth_user_id
        UPDATE public.profiles 
        SET auth_user_id = NEW.id
        WHERE id = existing_profile_id;
    ELSE
        -- Criar novo profile
        INSERT INTO public.profiles (id, auth_user_id, email, name, role, status)
        VALUES (
            COALESCE(NEW.id, gen_random_uuid()),
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

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Desabilitar RLS temporariamente para permitir operações
-- (Pode reabilitar depois se necessário)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods DISABLE ROW LEVEL SECURITY;

-- 9. Verificar resultado
SELECT id, email, name, role, status, auth_user_id 
FROM profiles 
WHERE email = 'wylkem.nutri.ufpa@gmail.com';

-- ============================================
-- FIM - Verifique se o admin aparece acima
-- ============================================
