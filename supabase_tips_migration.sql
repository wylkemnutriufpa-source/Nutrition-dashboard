-- =====================================================
-- MIGRAÇÃO: DICAS PERSONALIZADAS PARA PACIENTES
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar colunas faltantes na tabela tips
ALTER TABLE tips ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 2. Criar índice para patient_id
CREATE INDEX IF NOT EXISTS idx_tips_patient ON tips(patient_id);
CREATE INDEX IF NOT EXISTS idx_tips_active ON tips(is_active);

-- 3. Atualizar RLS para permitir que pacientes vejam suas próprias dicas

-- Remover policies antigas
DROP POLICY IF EXISTS "tips_select" ON tips;
DROP POLICY IF EXISTS "tips_insert" ON tips;
DROP POLICY IF EXISTS "tips_update" ON tips;
DROP POLICY IF EXISTS "tips_delete" ON tips;

-- Policy: Paciente pode ver dicas destinadas a ele (is_active = true)
CREATE POLICY "tips_select" ON tips
FOR SELECT USING (
  -- Profissional vê suas próprias dicas
  professional_id = auth.uid()
  OR 
  -- Paciente vê dicas destinadas a ele
  (patient_id = auth.uid() AND is_active = true)
  OR 
  -- Admin vê tudo
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Apenas profissional/admin pode criar dicas
CREATE POLICY "tips_insert" ON tips
FOR INSERT WITH CHECK (
  professional_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professional'))
);

-- Policy: Apenas profissional dono ou admin pode atualizar
CREATE POLICY "tips_update" ON tips
FOR UPDATE USING (
  professional_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Apenas profissional dono ou admin pode deletar
CREATE POLICY "tips_delete" ON tips
FOR DELETE USING (
  professional_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Após executar, rode este SELECT para verificar:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tips';
