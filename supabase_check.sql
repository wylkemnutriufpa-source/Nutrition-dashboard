-- ============================================
-- SQL RÁPIDO PARA VERIFICAR/CORRIGIR
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'patient_profiles', 'meal_plans', 'anamnesis', 'checklist_templates', 'checklist_entries', 'patient_messages');

-- 2. Desabilitar RLS em todas as tabelas (caso esteja causando bloqueio)
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meal_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS anamnesis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklist_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklist_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS branding_configs DISABLE ROW LEVEL SECURITY;

-- 3. Verificar admin
SELECT id, email, name, role, status FROM profiles WHERE email = 'wylkem.nutri.ufpa@gmail.com';

-- 4. Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 5. Verificar se há constraint FK problemática
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='profiles';
