-- ============================================
-- MIGRAÇÃO: Atualizar tabela anamnesis para novo formato
-- ============================================

-- Adicionar novos campos se não existirem
DO $$ 
BEGIN
    -- medical_conditions como JSONB array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'medical_conditions') THEN
        ALTER TABLE anamnesis ADD COLUMN medical_conditions JSONB DEFAULT '[]';
    END IF;

    -- no_medical_conditions como boolean
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'no_medical_conditions') THEN
        ALTER TABLE anamnesis ADD COLUMN no_medical_conditions BOOLEAN DEFAULT FALSE;
    END IF;

    -- other_medical_conditions como TEXT
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'other_medical_conditions') THEN
        ALTER TABLE anamnesis ADD COLUMN other_medical_conditions TEXT;
    END IF;

    -- food_intolerances como array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'food_intolerances') THEN
        ALTER TABLE anamnesis ADD COLUMN food_intolerances TEXT[];
    END IF;

    -- supplements_current
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'supplements_current') THEN
        ALTER TABLE anamnesis ADD COLUMN supplements_current TEXT;
    END IF;

    -- Campos de estilo de vida
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'stress_level') THEN
        ALTER TABLE anamnesis ADD COLUMN stress_level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'sleep_quality') THEN
        ALTER TABLE anamnesis ADD COLUMN sleep_quality TEXT;
    END IF;

    -- Campos de alimentação
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'meals_per_day') THEN
        ALTER TABLE anamnesis ADD COLUMN meals_per_day INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'eat_out_frequency') THEN
        ALTER TABLE anamnesis ADD COLUMN eat_out_frequency INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'food_preference') THEN
        ALTER TABLE anamnesis ADD COLUMN food_preference TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'favorite_foods') THEN
        ALTER TABLE anamnesis ADD COLUMN favorite_foods TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'disliked_foods') THEN
        ALTER TABLE anamnesis ADD COLUMN disliked_foods TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'previous_diets') THEN
        ALTER TABLE anamnesis ADD COLUMN previous_diets TEXT;
    END IF;

    -- Campos esportivos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'exercises_regularly') THEN
        ALTER TABLE anamnesis ADD COLUMN exercises_regularly TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'physical_activity_level') THEN
        ALTER TABLE anamnesis ADD COLUMN physical_activity_level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'sports_modalities') THEN
        ALTER TABLE anamnesis ADD COLUMN sports_modalities TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'training_frequency') THEN
        ALTER TABLE anamnesis ADD COLUMN training_frequency INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'training_duration') THEN
        ALTER TABLE anamnesis ADD COLUMN training_duration INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'training_time') THEN
        ALTER TABLE anamnesis ADD COLUMN training_time TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'sports_goal') THEN
        ALTER TABLE anamnesis ADD COLUMN sports_goal TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'training_experience') THEN
        ALTER TABLE anamnesis ADD COLUMN training_experience TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'injuries_limitations') THEN
        ALTER TABLE anamnesis ADD COLUMN injuries_limitations TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'sports_supplements') THEN
        ALTER TABLE anamnesis ADD COLUMN sports_supplements TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'upcoming_events') THEN
        ALTER TABLE anamnesis ADD COLUMN upcoming_events TEXT;
    END IF;

    -- status e last_edited_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'status') THEN
        ALTER TABLE anamnesis ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis' AND column_name = 'last_edited_by') THEN
        ALTER TABLE anamnesis ADD COLUMN last_edited_by TEXT;
    END IF;

    -- Renomear campos antigos se existirem
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'anamnesis' AND column_name = 'medications' 
               AND data_type = 'ARRAY') THEN
        -- Converter array para text se necessário
        ALTER TABLE anamnesis RENAME COLUMN medications TO medications_old;
        ALTER TABLE anamnesis ADD COLUMN medications TEXT;
    END IF;
END $$;

-- Comentários
COMMENT ON COLUMN anamnesis.medical_conditions IS 'Array JSONB de condições médicas selecionadas via checkbox';
COMMENT ON COLUMN anamnesis.no_medical_conditions IS 'TRUE se paciente marcou que não tem problemas de saúde';
COMMENT ON COLUMN anamnesis.sports_goal IS 'Objetivo principal: weight_loss, muscle_gain, maintenance, health, performance';
COMMENT ON COLUMN anamnesis.status IS 'Status: incomplete, draft, complete';
COMMENT ON COLUMN anamnesis.last_edited_by IS 'Quem editou por último: patient ou professional';

-- Garantir que existe constraint unique em patient_id (para evitar duplicatas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'anamnesis_patient_id_unique') THEN
        ALTER TABLE anamnesis ADD CONSTRAINT anamnesis_patient_id_unique UNIQUE (patient_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;
