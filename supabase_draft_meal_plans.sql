-- ============================================
-- DRAFT MEAL PLANS (PRÉ-PLANOS INTELIGENTES)
-- Tabela para armazenar pré-planos gerados pela anamnese
-- ============================================

-- Criar tabela draft_meal_plans
CREATE TABLE IF NOT EXISTS draft_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_draft_meal_plans_patient ON draft_meal_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_draft_meal_plans_professional ON draft_meal_plans(professional_id);

-- RLS (Row Level Security)
ALTER TABLE draft_meal_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Profissionais podem ver e editar seus pré-planos
CREATE POLICY "Professionals can view their draft plans" ON draft_meal_plans
    FOR SELECT
    USING (
        professional_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Professionals can insert draft plans" ON draft_meal_plans
    FOR INSERT
    WITH CHECK (
        professional_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Professionals can update their draft plans" ON draft_meal_plans
    FOR UPDATE
    USING (
        professional_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Admins podem ver tudo
CREATE POLICY "Admins can view all draft plans" ON draft_meal_plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Atualizar coluna is_active e auto_generated na tabela tips (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tips' AND column_name = 'auto_generated') THEN
        ALTER TABLE tips ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Comentários
COMMENT ON TABLE draft_meal_plans IS 'Pré-planos alimentares gerados automaticamente pela anamnese inteligente';
COMMENT ON COLUMN draft_meal_plans.draft_data IS 'JSON contendo meals, recommendedFoods, foodsToAvoid, tips, reasoning';
COMMENT ON COLUMN draft_meal_plans.generated_at IS 'Data/hora da geração automática';
COMMENT ON COLUMN draft_meal_plans.updated_at IS 'Data/hora da última edição pelo profissional';
