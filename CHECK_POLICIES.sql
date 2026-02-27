-- ============================================
-- VERIFICAR POLICIES ATUAIS DE meal_plans
-- ============================================

-- 1. LISTAR TODAS AS POLICIES INSERT
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'meal_plans' 
AND cmd = 'INSERT'
ORDER BY policyname;

-- 2. LISTAR TODAS AS POLICIES (RESUMO)
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'meal_plans'
ORDER BY cmd, policyname;

-- 3. VERIFICAR RELACIONAMENTO patient_profiles
SELECT 
    patient_id,
    professional_id,
    status
FROM patient_profiles
WHERE patient_id = '86a6b258-8602-49e8-80c7-b9a0e8485a4a'
AND professional_id = '177ff33f-f573-4a9c-aca1-1e4c55d94ece';
