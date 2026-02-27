-- =====================================================
-- AVALIAÇÃO FÍSICA COMPLETA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Criar tabela de avaliações físicas
CREATE TABLE IF NOT EXISTS physical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Data da avaliação
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Dados Básicos
  weight DECIMAL(5,2), -- Peso em kg
  height DECIMAL(5,2), -- Altura em cm
  bmi DECIMAL(4,2), -- IMC (calculado)
  
  -- Circunferências (em cm)
  waist DECIMAL(5,2), -- Cintura
  hip DECIMAL(5,2), -- Quadril
  waist_hip_ratio DECIMAL(4,3), -- Relação cintura/quadril
  arm_right DECIMAL(5,2), -- Braço direito
  arm_left DECIMAL(5,2), -- Braço esquerdo
  thigh_right DECIMAL(5,2), -- Coxa direita
  thigh_left DECIMAL(5,2), -- Coxa esquerda
  calf_right DECIMAL(5,2), -- Panturrilha direita
  calf_left DECIMAL(5,2), -- Panturrilha esquerda
  chest DECIMAL(5,2), -- Tórax
  abdomen DECIMAL(5,2), -- Abdômen
  neck DECIMAL(5,2), -- Pescoço
  
  -- Composição Corporal
  body_fat_percentage DECIMAL(4,2), -- % Gordura corporal
  lean_mass DECIMAL(5,2), -- Massa magra em kg
  fat_mass DECIMAL(5,2), -- Massa gorda em kg
  body_water DECIMAL(4,2), -- % Água corporal
  visceral_fat INTEGER, -- Gordura visceral (índice)
  bone_mass DECIMAL(4,2), -- Massa óssea em kg
  muscle_mass DECIMAL(5,2), -- Massa muscular em kg
  
  -- Dobras Cutâneas (em mm)
  skinfold_triceps DECIMAL(4,2),
  skinfold_biceps DECIMAL(4,2),
  skinfold_subscapular DECIMAL(4,2),
  skinfold_suprailiac DECIMAL(4,2),
  skinfold_abdominal DECIMAL(4,2),
  skinfold_thigh DECIMAL(4,2),
  skinfold_chest DECIMAL(4,2),
  skinfold_axillary DECIMAL(4,2),
  skinfold_sum DECIMAL(5,2), -- Soma das dobras
  
  -- Dados Vitais
  blood_pressure_systolic INTEGER, -- Pressão sistólica
  blood_pressure_diastolic INTEGER, -- Pressão diastólica
  heart_rate INTEGER, -- Frequência cardíaca
  basal_metabolic_rate DECIMAL(6,2), -- TMB
  
  -- Fotos (URLs)
  photo_front TEXT,
  photo_side TEXT,
  photo_back TEXT,
  
  -- Campos personalizados (JSON para flexibilidade)
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_assessments_patient ON physical_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_professional ON physical_assessments(professional_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON physical_assessments(assessment_date DESC);

-- 3. Habilitar RLS
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
DROP POLICY IF EXISTS "assessments_select" ON physical_assessments;
DROP POLICY IF EXISTS "assessments_insert" ON physical_assessments;
DROP POLICY IF EXISTS "assessments_update" ON physical_assessments;
DROP POLICY IF EXISTS "assessments_delete" ON physical_assessments;

-- Profissional/Admin vê todas, paciente vê as suas
CREATE POLICY "assessments_select" ON physical_assessments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
  OR patient_id = auth.uid()
);

-- Apenas profissional/admin pode inserir
CREATE POLICY "assessments_insert" ON physical_assessments
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

-- Apenas profissional/admin pode atualizar
CREATE POLICY "assessments_update" ON physical_assessments
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

-- Apenas profissional/admin pode deletar
CREATE POLICY "assessments_delete" ON physical_assessments
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

-- 5. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assessment_updated_at ON physical_assessments;
CREATE TRIGGER trigger_assessment_updated_at
  BEFORE UPDATE ON physical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_updated_at();

-- 6. Verificar
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'physical_assessments' 
ORDER BY ordinal_position;
