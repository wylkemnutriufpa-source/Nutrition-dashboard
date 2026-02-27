-- =====================================================
-- CORREÇÃO: RECEITAS PARA PROFISSIONAL
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Atualizar RLS para profissionais verem TODAS as receitas

DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;

-- Profissional/Admin vê TODAS as receitas
-- Paciente vê apenas receitas visíveis para ele
CREATE POLICY "recipes_select" ON recipes
FOR SELECT USING (
  -- Profissional/Admin vê todas
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('professional', 'admin')
  )
  OR
  -- Dono da receita vê
  professional_id = auth.uid()
  OR
  -- Receitas públicas
  is_public = true
  OR
  -- Receitas globais (is_global = true)
  is_global = true
  OR
  -- Paciente vê receitas com visibilidade específica para ele
  EXISTS (
    SELECT 1 FROM recipe_patient_visibility rpv
    WHERE rpv.recipe_id = recipes.id
    AND rpv.patient_id = auth.uid()
    AND rpv.visible = true
  )
);

-- Profissional pode inserir receitas
CREATE POLICY "recipes_insert" ON recipes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('professional', 'admin')
  )
);

-- Profissional pode atualizar qualquer receita (ou apenas as suas - ajuste conforme necessário)
CREATE POLICY "recipes_update" ON recipes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('professional', 'admin')
  )
);

-- Profissional pode deletar qualquer receita (ou apenas as suas - ajuste conforme necessário)
CREATE POLICY "recipes_delete" ON recipes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('professional', 'admin')
  )
);

-- 2. Atribuir receitas sem dono ao profissional atual (OPCIONAL)
-- Substitua 'SEU_PROFESSIONAL_ID' pelo UUID do profissional
-- UPDATE recipes SET professional_id = 'SEU_PROFESSIONAL_ID' WHERE professional_id IS NULL;

-- 3. Verificar receitas
SELECT id, name, professional_id, is_active, is_global, visibility_mode FROM recipes;
