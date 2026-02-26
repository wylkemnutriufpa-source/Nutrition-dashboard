-- =====================================================
-- MENU CONFIGURÁVEL DO PACIENTE - "MEU PROJETO"
-- =====================================================

-- Tabela para armazenar a configuração do menu de cada paciente
CREATE TABLE IF NOT EXISTS patient_menu_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES profiles(id),
    menu_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_patient_menu_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_patient_menu_config_updated_at ON patient_menu_config;
CREATE TRIGGER trigger_patient_menu_config_updated_at
    BEFORE UPDATE ON patient_menu_config
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_menu_config_updated_at();

-- RLS Policies
ALTER TABLE patient_menu_config ENABLE ROW LEVEL SECURITY;

-- Paciente pode ver seu próprio menu
CREATE POLICY "patient_view_own_menu" ON patient_menu_config
    FOR SELECT USING (
        auth.uid() = patient_id
    );

-- Profissional/Admin pode ver e editar menu dos seus pacientes
CREATE POLICY "professional_manage_menu" ON patient_menu_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'professional')
        )
    );

-- =====================================================
-- TABELA PARA JORNADA DO PACIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_journey (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_name VARCHAR(255),
    plan_start_date DATE,
    plan_end_date DATE,
    plan_duration_days INTEGER,
    initial_weight DECIMAL(5,2),
    current_weight DECIMAL(5,2),
    target_weight DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de peso do paciente
CREATE TABLE IF NOT EXISTS weight_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos de progresso
CREATE TABLE IF NOT EXISTS progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50), -- 'before', 'progress', 'after'
    taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para journey
ALTER TABLE patient_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Policies para patient_journey
CREATE POLICY "patient_view_own_journey" ON patient_journey
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "professional_manage_journey" ON patient_journey
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'professional')
        )
    );

-- Policies para weight_history
CREATE POLICY "patient_manage_own_weight" ON weight_history
    FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "professional_view_weight" ON weight_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'professional')
        )
    );

-- Policies para progress_photos
CREATE POLICY "patient_manage_own_photos" ON progress_photos
    FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "professional_view_photos" ON progress_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'professional')
        )
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_patient_menu_config_patient ON patient_menu_config(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_journey_patient ON patient_journey(patient_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_patient ON weight_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_patient ON progress_photos(patient_id);

-- =====================================================
-- CONFIGURAÇÃO PADRÃO DO MENU (para referência)
-- =====================================================
-- O menu padrão é definido no código JavaScript:
-- [
--   { id: 'meal-plan', name: 'Meu Plano', icon: 'Calendar', route: '/patient/meal-plan', visible: true, order: 1 },
--   { id: 'tarefas', name: 'Minhas Tarefas', icon: 'ClipboardList', route: '/patient/tarefas', visible: true, order: 2 },
--   { id: 'feedbacks', name: 'Meus Feedbacks', icon: 'MessageSquare', route: '/patient/feedbacks', visible: true, order: 3 },
--   { id: 'receitas', name: 'Minhas Receitas', icon: 'ChefHat', route: '/patient/receitas', visible: true, order: 4 },
--   { id: 'lista-compras', name: 'Minha Lista de Compras', icon: 'ShoppingCart', route: '/patient/lista-compras', visible: true, order: 5 },
--   { id: 'suplementos', name: 'Suplementos', icon: 'Pill', route: '/patient/suplementos', visible: true, order: 6 },
--   { id: 'dicas', name: 'Dicas', icon: 'Lightbulb', route: '/patient/dicas', visible: true, order: 7 },
--   { id: 'jornada', name: 'Minha Jornada', icon: 'TrendingUp', route: '/patient/jornada', visible: true, order: 8 }
-- ]
