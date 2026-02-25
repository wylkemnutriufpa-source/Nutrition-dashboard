-- ============================================
-- FITJOURNEY - SQL CORRIGIDO PARA CONFIGURAR ADMIN
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. REMOVER A FK CONSTRAINT que está causando o problema
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- 2. Recriar a PK sem a FK para auth.users
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- 3. Adicionar coluna auth_user_id se não existir (para vincular opcionalmente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_user_id') THEN
        ALTER TABLE profiles ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Adicionar outras colunas necessárias
DO $$
BEGIN
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
END $$;

-- 5. Desabilitar RLS para permitir operações
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 6. Verificar se o admin já existe e atualizar ou criar
DO $$
DECLARE
    admin_auth_id UUID;
    admin_profile_id UUID;
BEGIN
    -- Buscar o ID do usuário no auth.users
    SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'wylkem.nutri.ufpa@gmail.com';
    
    -- Buscar o ID do profile existente
    SELECT id INTO admin_profile_id FROM profiles WHERE email = 'wylkem.nutri.ufpa@gmail.com';
    
    IF admin_profile_id IS NOT NULL THEN
        -- Profile existe, atualizar para admin
        UPDATE profiles 
        SET role = 'admin', 
            status = 'active',
            auth_user_id = admin_auth_id,
            name = COALESCE(name, 'Administrador')
        WHERE email = 'wylkem.nutri.ufpa@gmail.com';
        
        RAISE NOTICE 'Admin atualizado com sucesso!';
    ELSIF admin_auth_id IS NOT NULL THEN
        -- Usuário existe no auth mas não tem profile, criar com o mesmo ID
        INSERT INTO profiles (id, auth_user_id, email, name, role, status)
        VALUES (admin_auth_id, admin_auth_id, 'wylkem.nutri.ufpa@gmail.com', 'Administrador', 'admin', 'active');
        
        RAISE NOTICE 'Admin criado com ID do auth!';
    ELSE
        -- Não existe em lugar nenhum, criar novo
        INSERT INTO profiles (id, email, name, role, status)
        VALUES (gen_random_uuid(), 'wylkem.nutri.ufpa@gmail.com', 'Administrador', 'admin', 'active');
        
        RAISE NOTICE 'Admin criado com novo ID!';
    END IF;
END $$;

-- 7. Atualizar função de criação de profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_profile_id UUID;
BEGIN
    -- Verificar se já existe um profile com este email
    SELECT id INTO existing_profile_id FROM public.profiles WHERE email = NEW.email;
    
    IF existing_profile_id IS NOT NULL THEN
        -- Atualizar o profile existente vinculando ao auth user
        UPDATE public.profiles 
        SET auth_user_id = NEW.id
        WHERE id = existing_profile_id;
    ELSE
        -- Criar novo profile com o ID do auth user
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

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Criar tabelas auxiliares se não existirem
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, professional_id)
);

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

-- Desabilitar RLS nas outras tabelas também
ALTER TABLE patient_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans DISABLE ROW LEVEL SECURITY;

-- 9. Verificar resultado final
SELECT 
    p.id as profile_id,
    p.auth_user_id,
    p.email, 
    p.name, 
    p.role, 
    p.status,
    CASE WHEN u.id IS NOT NULL THEN 'SIM' ELSE 'NAO' END as tem_auth_user
FROM profiles p
LEFT JOIN auth.users u ON p.auth_user_id = u.id OR p.email = u.email
WHERE p.email = 'wylkem.nutri.ufpa@gmail.com';

-- ============================================
-- FIM - Verifique o resultado acima
-- O admin deve aparecer com role='admin'
-- ============================================
