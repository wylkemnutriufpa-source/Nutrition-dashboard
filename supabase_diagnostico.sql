-- ============================================
-- SCRIPT DE VERIFICAÇÃO E CORREÇÃO DE PERFIS
-- Execute no Supabase SQL Editor se necessário
-- ============================================

-- 1. VERIFICAR TODOS OS USUÁRIOS AUTH
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'role' as metadata_role
FROM auth.users
ORDER BY created_at DESC;

-- 2. VERIFICAR PERFIS EXISTENTES
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- 3. ENCONTRAR USUÁRIOS SEM PERFIL
SELECT 
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. CRIAR PERFIL PARA USUÁRIO ESPECÍFICO (SUBSTITUA O EMAIL)
-- Se você criou o admin mas o perfil não existe:
INSERT INTO profiles (id, email, name, role, created_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email),
    'admin', -- DEFINIR COMO ADMIN
    NOW()
FROM auth.users
WHERE email = 'SEU_EMAIL_ADMIN@example.com' -- SUBSTITUA AQUI
AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id);

-- 5. ATUALIZAR ROLE DE USUÁRIO EXISTENTE PARA ADMIN
-- Se o perfil existe mas a role está errada:
UPDATE profiles 
SET role = 'admin'
WHERE email = 'SEU_EMAIL_ADMIN@example.com'; -- SUBSTITUA AQUI

-- 6. VERIFICAR POLÍTICAS RLS (devem permitir usuário ver próprio perfil)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 7. DESABILITAR RLS TEMPORARIAMENTE (APENAS PARA TESTES)
-- CUIDADO: Isso permite acesso total à tabela
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 8. REABILITAR RLS (após testes)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- QUERIES DE DIAGNÓSTICO
-- ============================================

-- Ver perfil do usuário logado atual
SELECT * FROM profiles WHERE id = auth.uid();

-- Ver se o trigger está ativo
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
