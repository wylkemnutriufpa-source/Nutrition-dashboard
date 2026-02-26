-- =====================================================
-- FIXES P0 - NUTRITION DASHBOARD
-- =====================================================
-- Execute estes comandos no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. FIX RLS - PROJECT_SHOWCASE (Landing Page Editor)
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "project_showcase_select" ON project_showcase;
DROP POLICY IF EXISTS "project_showcase_insert" ON project_showcase;
DROP POLICY IF EXISTS "project_showcase_update" ON project_showcase;
DROP POLICY IF EXISTS "project_showcase_delete" ON project_showcase;

-- Permitir que profissionais gerenciem suas landing pages
CREATE POLICY "project_showcase_select" ON project_showcase
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = project_showcase.professional_id
    )
    OR
    is_public = true
  );

CREATE POLICY "project_showcase_insert" ON project_showcase
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = project_showcase.professional_id
    )
  );

CREATE POLICY "project_showcase_update" ON project_showcase
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = project_showcase.professional_id
    )
  );

CREATE POLICY "project_showcase_delete" ON project_showcase
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = project_showcase.professional_id
    )
  );

-- =====================================================
-- 2. FIX RLS - ANAMNESIS
-- =====================================================

DROP POLICY IF EXISTS "anamnesis_select" ON anamnesis;
DROP POLICY IF EXISTS "anamnesis_insert" ON anamnesis;
DROP POLICY IF EXISTS "anamnesis_update" ON anamnesis;
DROP POLICY IF EXISTS "anamnesis_delete" ON anamnesis;

-- Profissional pode ver anamnesis de seus pacientes
-- Paciente pode ver sua própria anamnesis
CREATE POLICY "anamnesis_select" ON anamnesis
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = anamnesis.professional_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE user_id = anamnesis.patient_id
    )
  );

CREATE POLICY "anamnesis_insert" ON anamnesis
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = anamnesis.professional_id
    )
  );

CREATE POLICY "anamnesis_update" ON anamnesis
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = anamnesis.professional_id
    )
  );

CREATE POLICY "anamnesis_delete" ON anamnesis
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE user_id = anamnesis.professional_id
    )
  );

-- =====================================================
-- 3. FIX RLS - PATIENT_JOURNEY
-- =====================================================

DROP POLICY IF EXISTS "patient_journey_select" ON patient_journey;
DROP POLICY IF EXISTS "patient_journey_insert" ON patient_journey;
DROP POLICY IF EXISTS "patient_journey_update" ON patient_journey;
DROP POLICY IF EXISTS "patient_journey_delete" ON patient_journey;

-- Profissional pode ver jornada de seus pacientes
-- Paciente pode ver e adicionar à sua própria jornada
CREATE POLICY "patient_journey_select" ON patient_journey
  FOR SELECT USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_journey.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = patient_journey.patient_id
    )
  );

CREATE POLICY "patient_journey_insert" ON patient_journey
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_journey.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = patient_journey.patient_id
    )
  );

CREATE POLICY "patient_journey_update" ON patient_journey
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_journey.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "patient_journey_delete" ON patient_journey
  FOR DELETE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_journey.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 4. CRIAR TABELA DE BRANDING
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS professional_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#059669',
  secondary_color VARCHAR(7) DEFAULT '#10b981',
  accent_color VARCHAR(7) DEFAULT '#34d399',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professional_id)
);

-- Habilitar RLS
ALTER TABLE professional_branding ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para branding
DROP POLICY IF EXISTS "branding_select" ON professional_branding;
DROP POLICY IF EXISTS "branding_insert" ON professional_branding;
DROP POLICY IF EXISTS "branding_update" ON professional_branding;
DROP POLICY IF EXISTS "branding_delete" ON professional_branding;

CREATE POLICY "branding_select" ON professional_branding
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = professional_branding.professional_id
    )
    OR
    -- Pacientes podem ver branding do seu profissional
    professional_id IN (
      SELECT professional_id FROM patient_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "branding_insert" ON professional_branding
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = professional_branding.professional_id
    )
  );

CREATE POLICY "branding_update" ON professional_branding
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = professional_branding.professional_id
    )
  );

CREATE POLICY "branding_delete" ON professional_branding
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = professional_branding.professional_id
    )
  );

-- =====================================================
-- 5. FIX ISOLAMENTO MULTI-PROFISSIONAL
-- =====================================================

-- PATIENTS: Verificar se já tem professional_id
-- (assumindo que já existe, apenas ajustando RLS)

DROP POLICY IF EXISTS "patient_profiles_select" ON patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_insert" ON patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_update" ON patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_delete" ON patient_profiles;

-- Profissional vê apenas SEUS pacientes
CREATE POLICY "patient_profiles_select" ON patient_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = patient_profiles.professional_id
    )
    OR
    auth.uid() = user_id
  );

CREATE POLICY "patient_profiles_insert" ON patient_profiles
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = patient_profiles.professional_id
    )
  );

CREATE POLICY "patient_profiles_update" ON patient_profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = patient_profiles.professional_id
    )
    OR
    auth.uid() = user_id
  );

CREATE POLICY "patient_profiles_delete" ON patient_profiles
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = patient_profiles.professional_id
    )
  );

-- =====================================================
-- 6. FIX RLS - MEAL_PLANS (Isolamento por profissional)
-- =====================================================

DROP POLICY IF EXISTS "meal_plans_select" ON meal_plans;
DROP POLICY IF EXISTS "meal_plans_insert" ON meal_plans;
DROP POLICY IF EXISTS "meal_plans_update" ON meal_plans;
DROP POLICY IF EXISTS "meal_plans_delete" ON meal_plans;

CREATE POLICY "meal_plans_select" ON meal_plans
  FOR SELECT USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = meal_plans.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = meal_plans.patient_id
    )
  );

CREATE POLICY "meal_plans_insert" ON meal_plans
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = meal_plans.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "meal_plans_update" ON meal_plans
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = meal_plans.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "meal_plans_delete" ON meal_plans
  FOR DELETE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = meal_plans.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 7. FIX RLS - APPOINTMENTS (Isolamento por profissional)
-- =====================================================

DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

CREATE POLICY "appointments_select" ON appointments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = appointments.professional_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = appointments.patient_id
    )
  );

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = appointments.professional_id
    )
  );

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = appointments.professional_id
    )
  );

CREATE POLICY "appointments_delete" ON appointments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = appointments.professional_id
    )
  );

-- =====================================================
-- 8. FIX RLS - FINANCIAL_TRANSACTIONS (Isolamento)
-- =====================================================

DROP POLICY IF EXISTS "financial_transactions_select" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete" ON financial_transactions;

CREATE POLICY "financial_transactions_select" ON financial_transactions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = financial_transactions.professional_id
    )
  );

CREATE POLICY "financial_transactions_insert" ON financial_transactions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = financial_transactions.professional_id
    )
  );

CREATE POLICY "financial_transactions_update" ON financial_transactions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = financial_transactions.professional_id
    )
  );

CREATE POLICY "financial_transactions_delete" ON financial_transactions
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles WHERE id = financial_transactions.professional_id
    )
  );

-- =====================================================
-- 9. FIX RLS - PATIENT_CHECKLISTS (Isolamento)
-- =====================================================

DROP POLICY IF EXISTS "patient_checklists_select" ON patient_checklists;
DROP POLICY IF EXISTS "patient_checklists_insert" ON patient_checklists;
DROP POLICY IF EXISTS "patient_checklists_update" ON patient_checklists;
DROP POLICY IF EXISTS "patient_checklists_delete" ON patient_checklists;

CREATE POLICY "patient_checklists_select" ON patient_checklists
  FOR SELECT USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_checklists.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = patient_checklists.patient_id
    )
  );

CREATE POLICY "patient_checklists_insert" ON patient_checklists
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_checklists.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = patient_checklists.patient_id
    )
  );

CREATE POLICY "patient_checklists_update" ON patient_checklists
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_checklists.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = patient_checklists.patient_id
    )
  );

CREATE POLICY "patient_checklists_delete" ON patient_checklists
  FOR DELETE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_checklists.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 10. FIX RLS - PATIENT_FEEDBACK (Isolamento)
-- =====================================================

DROP POLICY IF EXISTS "patient_feedback_select" ON patient_feedback;
DROP POLICY IF EXISTS "patient_feedback_insert" ON patient_feedback;
DROP POLICY IF EXISTS "patient_feedback_update" ON patient_feedback;
DROP POLICY IF EXISTS "patient_feedback_delete" ON patient_feedback;

CREATE POLICY "patient_feedback_select" ON patient_feedback
  FOR SELECT USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_feedback.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = patient_feedback.patient_id
    )
  );

CREATE POLICY "patient_feedback_insert" ON patient_feedback
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM patient_profiles WHERE id = patient_feedback.patient_id
    )
  );

CREATE POLICY "patient_feedback_update" ON patient_feedback
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_feedback.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "patient_feedback_delete" ON patient_feedback
  FOR DELETE USING (
    auth.uid() IN (
      SELECT pp.user_id 
      FROM patient_profiles pp 
      WHERE pp.id = patient_feedback.patient_id 
      AND pp.professional_id IN (
        SELECT id FROM professional_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- FIM DOS FIXES P0
-- =====================================================

-- Para verificar se as políticas foram aplicadas:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
