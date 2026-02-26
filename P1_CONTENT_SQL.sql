-- =====================================================
-- P1-5: CONTEÚDO (RECEITAS/DICAS/SUPLEMENTOS)
-- =====================================================
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela de receitas
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  prep_time INTEGER, -- minutos
  servings INTEGER,
  calories INTEGER,
  category VARCHAR(50), -- 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'
  tags TEXT[], -- array de tags
  image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- se true, outros profissionais podem ver
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de dicas
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50), -- 'nutrition', 'exercise', 'lifestyle', 'motivation'
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de suplementos
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  dosage TEXT,
  when_to_take TEXT, -- 'morning', 'afternoon', 'evening', 'with_meals'
  benefits TEXT,
  warnings TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_recipes_professional ON recipes(professional_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_tips_professional ON tips(professional_id);
CREATE INDEX IF NOT EXISTS idx_tips_category ON tips(category);
CREATE INDEX IF NOT EXISTS idx_supplements_professional ON supplements(professional_id);

-- 5. Habilitar RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS PARA RECIPES
-- =====================================================

DROP POLICY IF EXISTS "recipes_select" ON recipes;
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;

-- Profissional vê suas receitas + públicas
-- Paciente vê receitas do seu profissional
CREATE POLICY "recipes_select" ON recipes
  FOR SELECT USING (
    professional_id = auth.uid()
    OR
    is_public = true
    OR
    professional_id IN (
      SELECT professional_id FROM patient_profiles WHERE patient_id = auth.uid()
    )
  );

CREATE POLICY "recipes_insert" ON recipes
  FOR INSERT WITH CHECK (
    professional_id = auth.uid()
  );

CREATE POLICY "recipes_update" ON recipes
  FOR UPDATE USING (
    professional_id = auth.uid()
  );

CREATE POLICY "recipes_delete" ON recipes
  FOR DELETE USING (
    professional_id = auth.uid()
  );

-- =====================================================
-- RLS PARA TIPS
-- =====================================================

DROP POLICY IF EXISTS "tips_select" ON tips;
DROP POLICY IF EXISTS "tips_insert" ON tips;
DROP POLICY IF EXISTS "tips_update" ON tips;
DROP POLICY IF EXISTS "tips_delete" ON tips;

CREATE POLICY "tips_select" ON tips
  FOR SELECT USING (
    professional_id = auth.uid()
    OR
    is_public = true
    OR
    professional_id IN (
      SELECT professional_id FROM patient_profiles WHERE patient_id = auth.uid()
    )
  );

CREATE POLICY "tips_insert" ON tips
  FOR INSERT WITH CHECK (
    professional_id = auth.uid()
  );

CREATE POLICY "tips_update" ON tips
  FOR UPDATE USING (
    professional_id = auth.uid()
  );

CREATE POLICY "tips_delete" ON tips
  FOR DELETE USING (
    professional_id = auth.uid()
  );

-- =====================================================
-- RLS PARA SUPPLEMENTS
-- =====================================================

DROP POLICY IF EXISTS "supplements_select" ON supplements;
DROP POLICY IF EXISTS "supplements_insert" ON supplements;
DROP POLICY IF EXISTS "supplements_update" ON supplements;
DROP POLICY IF EXISTS "supplements_delete" ON supplements;

CREATE POLICY "supplements_select" ON supplements
  FOR SELECT USING (
    professional_id = auth.uid()
    OR
    is_public = true
    OR
    professional_id IN (
      SELECT professional_id FROM patient_profiles WHERE patient_id = auth.uid()
    )
  );

CREATE POLICY "supplements_insert" ON supplements
  FOR INSERT WITH CHECK (
    professional_id = auth.uid()
  );

CREATE POLICY "supplements_update" ON supplements
  FOR UPDATE USING (
    professional_id = auth.uid()
  );

CREATE POLICY "supplements_delete" ON supplements
  FOR DELETE USING (
    professional_id = auth.uid()
  );

-- =====================================================
-- FIM P1-5
-- =====================================================
