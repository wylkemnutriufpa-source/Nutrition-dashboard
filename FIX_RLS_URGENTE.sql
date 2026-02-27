-- ============================================
-- FIX URGENTE: RLS meal_plans para permitir INSERT/UPDATE
-- EXECUTE ESTE SQL NO SUPABASE AGORA
-- ============================================

BEGIN;

-- 1. REMOVER TODAS AS POLICIES ANTIGAS
DROP POLICY IF EXISTS "Professionals can view their patients meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can create meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can update their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can delete their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can view their own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Admin full access meal_plans" ON meal_plans;

-- 2. CRIAR POLICIES PERMISSIVAS (TEMPORÁRIO PARA DEBUG)
-- Admin acesso total
CREATE POLICY "Admin full access meal_plans" ON meal_plans
    FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Professional SELECT - SEM validação de vínculo por enquanto
CREATE POLICY "Professionals can view meal plans" ON meal_plans
    FOR SELECT 
    USING (
        professional_id = auth.uid()
    );

-- Professional INSERT - SEM validação de vínculo por enquanto
CREATE POLICY "Professionals can create meal plans" ON meal_plans
    FOR INSERT 
    WITH CHECK (
        professional_id = auth.uid()
    );

-- Professional UPDATE - SEM validação de vínculo por enquanto
CREATE POLICY "Professionals can update meal plans" ON meal_plans
    FOR UPDATE 
    USING (
        professional_id = auth.uid()
    )
    WITH CHECK (
        professional_id = auth.uid()
    );

-- Professional DELETE
CREATE POLICY "Professionals can delete meal plans" ON meal_plans
    FOR DELETE 
    USING (
        professional_id = auth.uid()
    );

-- Patient SELECT (read-only)
CREATE POLICY "Patients can view their own meal plans" ON meal_plans
    FOR SELECT 
    USING (patient_id = auth.uid());

COMMIT;

-- ============================================
-- VERIFICAÇÃO: Execute separadamente após o COMMIT
-- ============================================
-- SELECT policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'meal_plans'
-- ORDER BY policyname;
--
-- Deve retornar 6 policies
-- ============================================

-- ============================================
-- DEPOIS QUE FUNCIONAR, vamos adicionar a validação 
-- de vínculo patient_profiles de volta
-- ============================================
