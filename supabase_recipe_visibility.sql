-- ============================================
-- RECIPE VISIBILITY CONTROL
-- Sistema de controle de visibilidade de receitas por paciente
-- ============================================

-- Tabela de visibilidade de receitas
-- Define quais receitas cada paciente pode ver
CREATE TABLE IF NOT EXISTS recipe_patient_visibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, patient_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_recipe_visibility_recipe ON recipe_patient_visibility(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_visibility_patient ON recipe_patient_visibility(patient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_visibility_professional ON recipe_patient_visibility(professional_id);

-- RLS (Row Level Security)
ALTER TABLE recipe_patient_visibility ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Profissionais podem ver visibilidade de suas receitas
CREATE POLICY "Professionals can view recipe visibility" ON recipe_patient_visibility
    FOR SELECT
    USING (
        professional_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Profissionais podem inserir visibilidade
CREATE POLICY "Professionals can insert recipe visibility" ON recipe_patient_visibility
    FOR INSERT
    WITH CHECK (
        professional_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Profissionais podem atualizar visibilidade
CREATE POLICY "Professionals can update recipe visibility" ON recipe_patient_visibility
    FOR UPDATE
    USING (
        professional_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Profissionais podem deletar visibilidade
CREATE POLICY "Professionals can delete recipe visibility" ON recipe_patient_visibility
    FOR DELETE
    USING (
        professional_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Pacientes podem ver suas próprias entradas de visibilidade
CREATE POLICY "Patients can view their recipe visibility" ON recipe_patient_visibility
    FOR SELECT
    USING (patient_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_recipe_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recipe_visibility_updated_at ON recipe_patient_visibility;
CREATE TRIGGER trigger_recipe_visibility_updated_at
    BEFORE UPDATE ON recipe_patient_visibility
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_visibility_updated_at();

-- Comentários
COMMENT ON TABLE recipe_patient_visibility IS 'Controle de visibilidade de receitas por paciente';
COMMENT ON COLUMN recipe_patient_visibility.visible IS 'Se true, o paciente pode ver esta receita';

-- ============================================
-- VERIFICAR SE TABELA RECIPES TEM CAMPOS NECESSÁRIOS
-- ============================================
DO $$
BEGIN
    -- Adicionar campo professional_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'professional_id') THEN
        ALTER TABLE recipes ADD COLUMN professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar campo is_active se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'is_active') THEN
        ALTER TABLE recipes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Adicionar campo is_global se não existir (receitas disponíveis para todos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'is_global') THEN
        ALTER TABLE recipes ADD COLUMN is_global BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Adicionar campo visibility_mode se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'visibility_mode') THEN
        ALTER TABLE recipes ADD COLUMN visibility_mode VARCHAR(20) DEFAULT 'selected';
        -- 'all' = todos os pacientes veem
        -- 'selected' = só pacientes selecionados veem
        -- 'none' = nenhum paciente vê (rascunho)
    END IF;
END $$;

-- ============================================
-- FUNÇÃO PARA OBTER RECEITAS VISÍVEIS PARA PACIENTE
-- ============================================
CREATE OR REPLACE FUNCTION get_visible_recipes_for_patient(p_patient_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    category VARCHAR,
    time INTEGER,
    servings INTEGER,
    calories INTEGER,
    image TEXT,
    ingredients JSONB,
    instructions JSONB,
    tips TEXT,
    professional_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.category,
        r.time,
        r.servings,
        r.calories,
        r.image,
        r.ingredients,
        r.instructions,
        r.tips,
        r.professional_id
    FROM recipes r
    WHERE r.is_active = TRUE
    AND (
        -- Receitas globais
        r.is_global = TRUE
        OR r.visibility_mode = 'all'
        -- Ou receitas com visibilidade específica
        OR EXISTS (
            SELECT 1 FROM recipe_patient_visibility rpv
            WHERE rpv.recipe_id = r.id
            AND rpv.patient_id = p_patient_id
            AND rpv.visible = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_visible_recipes_for_patient(UUID) TO authenticated;
