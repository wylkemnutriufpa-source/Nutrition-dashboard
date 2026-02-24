-- ============================================
-- ETAPA 2: TABELAS ADICIONAIS PARA MEAL PLANS
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELA MEAL_PLANS (Planos Alimentares)
-- ============================================
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Plano Alimentar',
    plan_data JSONB NOT NULL DEFAULT '{"meals": []}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_patient_professional 
        FOREIGN KEY (patient_id, professional_id) 
        REFERENCES patient_profiles(patient_id, professional_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_patient ON meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_professional ON meal_plans(professional_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_active ON meal_plans(is_active);

-- Trigger para auto-update
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 2. RLS POLICIES PARA MEAL_PLANS
-- ============================================

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Profissional pode ver planos de seus pacientes
CREATE POLICY "Professionals can view their patients meal plans" ON meal_plans
    FOR SELECT USING (professional_id = auth.uid());

-- Profissional pode criar planos para seus pacientes
CREATE POLICY "Professionals can create meal plans for their patients" ON meal_plans
    FOR INSERT WITH CHECK (
        professional_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM patient_profiles
            WHERE patient_id = meal_plans.patient_id
            AND professional_id = auth.uid()
        )
    );

-- Profissional pode atualizar seus planos
CREATE POLICY "Professionals can update their meal plans" ON meal_plans
    FOR UPDATE USING (professional_id = auth.uid());

-- Profissional pode deletar seus planos
CREATE POLICY "Professionals can delete their meal plans" ON meal_plans
    FOR DELETE USING (professional_id = auth.uid());

-- Paciente pode ver seus próprios planos
CREATE POLICY "Patients can view their own meal plans" ON meal_plans
    FOR SELECT USING (patient_id = auth.uid());

-- ============================================
-- 3. FUNÇÕES HELPER (OPCIONAL)
-- ============================================

-- Função para obter plano ativo do paciente
CREATE OR REPLACE FUNCTION get_active_meal_plan(p_patient_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    plan_data JSONB,
    professional_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.id,
        mp.name,
        mp.plan_data,
        mp.professional_id,
        mp.created_at,
        mp.updated_at
    FROM meal_plans mp
    WHERE mp.patient_id = p_patient_id
    AND mp.is_active = TRUE
    ORDER BY mp.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. EXEMPLO DE ESTRUTURA plan_data (JSON)
-- ============================================

/*
{
  "meals": [
    {
      "id": "m1",
      "name": "Café da Manhã",
      "time": "07:00",
      "color": "#F59E0B",
      "foods": [
        {
          "id": "f1",
          "foodId": 9,
          "quantity": 50,
          "unit": "g",
          "measure": "3 colheres de sopa"
        }
      ]
    }
  ],
  "totals": {
    "calorias": 1800,
    "proteina": 90,
    "carboidrato": 200,
    "gordura": 60
  }
}
*/

-- ============================================
-- 5. DADOS DE EXEMPLO (OPCIONAL)
-- ============================================

-- Após criar profissional e paciente, você pode inserir um plano exemplo:
/*
INSERT INTO meal_plans (patient_id, professional_id, name, plan_data)
VALUES (
    'uuid-do-paciente',
    'uuid-do-profissional',
    'Plano de Emagrecimento',
    '{
        "meals": [
            {
                "id": "m1",
                "name": "Café da Manhã",
                "time": "07:00",
                "foods": []
            }
        ]
    }'::jsonb
);
*/

-- ============================================
-- FIM DO SCHEMA ETAPA 2
-- ============================================
