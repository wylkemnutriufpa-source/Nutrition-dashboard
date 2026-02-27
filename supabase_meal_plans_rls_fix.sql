-- ============================================
-- FIX: RLS Policies para meal_plans
-- Corrige bug de salvar plano do rascunho
-- Data: 2025
-- Branch: main-feature-FIX2
-- ============================================
--
-- PROBLEMA: Ao carregar plano do rascunho e clicar em "Salvar",
-- o plano não persiste devido a conflitos de RLS.
--
-- SOLUÇÃO: Adicionar validação de vínculo professional-patient
-- em todas as policies de meal_plans via tabela patient_profiles
--
-- ============================================

BEGIN;

-- Remove policies antigas que têm conflitos
DROP POLICY IF EXISTS "Professionals can view their patients meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can create meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can update their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can delete their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can view their own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Admin full access meal_plans" ON meal_plans;

-- ==================== NOVA ESTRUTURA DE POLICIES ====================

-- 1. Admin pode tudo (mantém acesso total)
CREATE POLICY "Admin full access meal_plans" ON meal_plans
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. ✅ FIX: Professional SELECT com validação de vínculo
-- Professional só pode ver planos de pacientes que estão vinculados a ele
CREATE POLICY "Professionals can view their patients meal plans" ON meal_plans
    FOR SELECT 
    USING (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- 3. ✅ FIX: Professional INSERT com validação de vínculo
-- Professional só pode criar planos para pacientes vinculados a ele
CREATE POLICY "Professionals can create meal plans" ON meal_plans
    FOR INSERT 
    WITH CHECK (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- 4. ✅ FIX: Professional UPDATE com USING + WITH CHECK
-- Professional só pode atualizar planos de pacientes vinculados
-- USING: valida linha existente
-- WITH CHECK: valida valores sendo atualizados
CREATE POLICY "Professionals can update their meal plans" ON meal_plans
    FOR UPDATE 
    USING (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    )
    WITH CHECK (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- 5. Professional DELETE com validação de vínculo
-- Professional só pode deletar planos de pacientes vinculados
CREATE POLICY "Professionals can delete their meal plans" ON meal_plans
    FOR DELETE 
    USING (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- 6. Patient SELECT (sem mudanças - já estava correto)
-- Paciente só pode ver seus próprios planos
CREATE POLICY "Patients can view their own meal plans" ON meal_plans
    FOR SELECT 
    USING (patient_id = auth.uid());

COMMIT;

-- ============================================
-- VERIFICAÇÃO: Listar policies criadas
-- ============================================
-- Execute isso separadamente para verificar:
-- 
-- SELECT 
--     schemaname, 
--     tablename, 
--     policyname, 
--     cmd, 
--     SUBSTRING(qual::text, 1, 100) as using_clause,
--     SUBSTRING(with_check::text, 1, 100) as with_check_clause
-- FROM pg_policies 
-- WHERE tablename = 'meal_plans'
-- ORDER BY policyname;
--
-- Deve retornar 6 policies:
-- 1. Admin full access meal_plans (FOR ALL)
-- 2. Patients can view their own meal plans (FOR SELECT)
-- 3. Professionals can create meal plans (FOR INSERT)
-- 4. Professionals can delete their meal plans (FOR DELETE)
-- 5. Professionals can update their meal plans (FOR UPDATE)
-- 6. Professionals can view their patients meal plans (FOR SELECT)
-- ============================================

-- ============================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================

COMMENT ON POLICY "Professionals can view their patients meal plans" ON meal_plans IS 
'Professional pode ver apenas planos de pacientes com vínculo ativo em patient_profiles';

COMMENT ON POLICY "Professionals can create meal plans" ON meal_plans IS 
'Professional pode criar planos apenas para pacientes vinculados (valida via patient_profiles.status=active)';

COMMENT ON POLICY "Professionals can update their meal plans" ON meal_plans IS 
'Professional pode atualizar apenas planos de pacientes vinculados. USING valida linha existente, WITH CHECK valida valores atualizados';

COMMENT ON POLICY "Professionals can delete their meal plans" ON meal_plans IS 
'Professional pode deletar apenas planos de pacientes vinculados';

-- ============================================
-- FIM DAS CORREÇÕES
-- ============================================
