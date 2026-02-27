-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA
-- Execute TUDO no Supabase SQL Editor
-- =====================================================

-- ================= PARTE 1: VERIFICAR TABELAS =================

-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('recipes', 'tips', 'recipe_patient_visibility', 'patient_menu_config');

-- ================= PARTE 2: CRIAR TABELAS SE NÃO EXISTIREM =================

-- Tabela de receitas (se não existir)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category VARCHAR(50),
  time INTEGER DEFAULT 30,
  servings INTEGER DEFAULT 2,
  calories INTEGER DEFAULT 0,
  image TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  tips TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_global BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  visibility_mode VARCHAR(20) DEFAULT 'selected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de visibilidade de receitas
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

-- Adicionar colunas que podem estar faltando na tabela tips
ALTER TABLE tips ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- ================= PARTE 3: HABILITAR RLS =================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_patient_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- ================= PARTE 4: CORRIGIR RLS RECEITAS =================

DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;
DROP POLICY IF EXISTS "Professionals can view recipe visibility" ON recipe_patient_visibility;
DROP POLICY IF EXISTS "Professionals can insert recipe visibility" ON recipe_patient_visibility;
DROP POLICY IF EXISTS "Professionals can update recipe visibility" ON recipe_patient_visibility;
DROP POLICY IF EXISTS "Professionals can delete recipe visibility" ON recipe_patient_visibility;
DROP POLICY IF EXISTS "Patients can view their recipe visibility" ON recipe_patient_visibility;

-- RECEITAS: Profissional/Admin vê TUDO
CREATE POLICY "recipes_select" ON recipes
FOR SELECT USING (
  -- Profissional/Admin vê todas
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
  OR
  -- Receitas globais
  is_global = true
  OR
  -- Receitas com visibilidade específica para o paciente
  EXISTS (
    SELECT 1 FROM recipe_patient_visibility rpv
    WHERE rpv.recipe_id = id AND rpv.patient_id = auth.uid() AND rpv.visible = true
  )
);

CREATE POLICY "recipes_insert" ON recipes
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

CREATE POLICY "recipes_update" ON recipes
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

CREATE POLICY "recipes_delete" ON recipes
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

-- VISIBILIDADE DE RECEITAS
CREATE POLICY "visibility_select" ON recipe_patient_visibility
FOR SELECT USING (
  professional_id = auth.uid() 
  OR patient_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "visibility_insert" ON recipe_patient_visibility
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

CREATE POLICY "visibility_update" ON recipe_patient_visibility
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

CREATE POLICY "visibility_delete" ON recipe_patient_visibility
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

-- ================= PARTE 5: CORRIGIR RLS DICAS =================

DROP POLICY IF EXISTS "tips_select" ON tips;
DROP POLICY IF EXISTS "tips_insert" ON tips;
DROP POLICY IF EXISTS "tips_update" ON tips;
DROP POLICY IF EXISTS "tips_delete" ON tips;

-- DICAS: Profissional vê tudo, Paciente vê as suas
CREATE POLICY "tips_select" ON tips
FOR SELECT USING (
  -- Profissional/Admin vê todas
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
  OR 
  -- Paciente vê dicas destinadas a ele (ativas)
  (patient_id = auth.uid() AND is_active = true)
  OR
  -- Dicas públicas
  is_public = true
);

CREATE POLICY "tips_insert" ON tips
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professional'))
);

CREATE POLICY "tips_update" ON tips
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professional'))
);

CREATE POLICY "tips_delete" ON tips
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professional'))
);

-- ================= PARTE 6: CRIAR ÍNDICES =================

CREATE INDEX IF NOT EXISTS idx_recipes_professional ON recipes(professional_id);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_recipes_global ON recipes(is_global);
CREATE INDEX IF NOT EXISTS idx_recipe_visibility_recipe ON recipe_patient_visibility(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_visibility_patient ON recipe_patient_visibility(patient_id);
CREATE INDEX IF NOT EXISTS idx_tips_patient ON tips(patient_id);
CREATE INDEX IF NOT EXISTS idx_tips_active ON tips(is_active);
CREATE INDEX IF NOT EXISTS idx_tips_category ON tips(category);

-- ================= PARTE 7: INSERIR RECEITAS DE EXEMPLO =================
-- (Apenas se a tabela estiver vazia)

INSERT INTO recipes (name, category, time, servings, calories, ingredients, instructions, tips, is_active, is_global)
SELECT 
  'Omelete de Claras com Espinafre',
  'cafe-da-manha',
  10, 1, 180,
  '["3 claras de ovo", "1 xícara de espinafre", "Sal e pimenta a gosto", "1 colher de azeite"]'::jsonb,
  '["Bata as claras em uma tigela", "Aqueça o azeite em frigideira antiaderente", "Adicione o espinafre e refogue por 1 minuto", "Despeje as claras sobre o espinafre", "Cozinhe em fogo baixo até firmar"]'::jsonb,
  'Adicione tomate cereja para mais sabor!',
  true, true
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Omelete de Claras com Espinafre');

INSERT INTO recipes (name, category, time, servings, calories, ingredients, instructions, tips, is_active, is_global)
SELECT 
  'Salada de Frango Grelhado',
  'almoco',
  20, 2, 350,
  '["200g peito de frango", "Mix de folhas verdes", "1 tomate", "1/2 pepino", "Azeite e limão"]'::jsonb,
  '["Tempere o frango com sal e pimenta", "Grelhe em fogo médio por 6 min cada lado", "Lave e corte os vegetais", "Fatie o frango sobre as folhas", "Tempere com azeite e limão"]'::jsonb,
  'Deixe o frango descansar 3 minutos antes de fatiar!',
  true, true
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salada de Frango Grelhado');

INSERT INTO recipes (name, category, time, servings, calories, ingredients, instructions, tips, is_active, is_global)
SELECT 
  'Smoothie de Banana e Aveia',
  'lanche',
  5, 1, 250,
  '["1 banana congelada", "1 colher de aveia", "200ml leite desnatado", "1 colher de mel"]'::jsonb,
  '["Coloque todos os ingredientes no liquidificador", "Bata até ficar cremoso", "Sirva imediatamente"]'::jsonb,
  'Congele a banana em rodelas para um smoothie mais cremoso!',
  true, true
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Smoothie de Banana e Aveia');

-- ================= VERIFICAÇÃO FINAL =================

-- Ver receitas
SELECT id, name, category, is_active, is_global FROM recipes;

-- Ver dicas com patient_id
SELECT id, title, category, patient_id, is_active FROM tips WHERE patient_id IS NOT NULL;

-- Ver estrutura da tabela tips
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tips';
