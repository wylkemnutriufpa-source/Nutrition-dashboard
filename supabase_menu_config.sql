-- ==========================================
-- SCHEMA: Menu Configurável "Meu Projeto"
-- ==========================================

-- Tabela de configuração do menu do paciente
CREATE TABLE IF NOT EXISTS patient_menu_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = config padrão do profissional
    
    -- Items do menu como JSONB
    items JSONB NOT NULL DEFAULT '[
        {"key": "dashboard", "label": "Dashboard", "icon": "Home", "route": "/patient/dashboard", "visible": true, "order": 0},
        {"key": "meal_plan", "label": "Meu Plano", "icon": "Utensils", "route": "/patient/meal-plan", "visible": true, "order": 1},
        {"key": "tasks", "label": "Minhas Tarefas", "icon": "ClipboardList", "route": "/patient/checklist", "visible": true, "order": 2},
        {"key": "feedback", "label": "Meus Feedbacks", "icon": "MessageSquare", "route": "/patient/feedback", "visible": true, "order": 3},
        {"key": "recipes", "label": "Minhas Receitas", "icon": "ChefHat", "route": "/patient/recipes", "visible": true, "order": 4},
        {"key": "shopping", "label": "Lista de Compras", "icon": "ShoppingCart", "route": "/patient/shopping-list", "visible": true, "order": 5},
        {"key": "supplements", "label": "Suplementos", "icon": "Pill", "route": "/patient/supplements", "visible": true, "order": 6},
        {"key": "tips", "label": "Dicas", "icon": "Lightbulb", "route": "/patient/tips", "visible": true, "order": 7},
        {"key": "journey", "label": "Minha Jornada", "icon": "TrendingUp", "route": "/patient/journey", "visible": true, "order": 8},
        {"key": "calculators", "label": "Calculadoras", "icon": "Calculator", "route": "/patient/calculators", "visible": true, "order": 9}
    ]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: um profissional pode ter apenas uma config padrão (patient_id NULL)
-- e uma config por paciente
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_config_unique 
    ON patient_menu_configs(professional_id, COALESCE(patient_id, '00000000-0000-0000-0000-000000000000'));

-- Tabela de receitas do profissional (compartilhadas com pacientes)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- café da manhã, almoço, jantar, lanche, sobremesa
    prep_time_minutes INTEGER,
    servings INTEGER DEFAULT 1,
    
    -- Ingredientes como JSONB: [{name, quantity, unit}]
    ingredients JSONB DEFAULT '[]'::jsonb,
    
    -- Instruções como array de texto
    instructions TEXT[],
    
    -- Informações nutricionais
    calories DECIMAL(8,2),
    protein DECIMAL(8,2),
    carbs DECIMAL(8,2),
    fat DECIMAL(8,2),
    fiber DECIMAL(8,2),
    
    -- Imagem
    image_url TEXT,
    
    -- Visibilidade
    is_public BOOLEAN DEFAULT false, -- Se true, aparece para todos pacientes do profissional
    
    -- Pacientes que podem ver (se não for pública)
    visible_to_patients UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de suplementos prescritos
CREATE TABLE IF NOT EXISTS patient_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    dosage VARCHAR(100), -- Ex: "1 cápsula", "5g", "30ml"
    frequency VARCHAR(100), -- Ex: "1x ao dia", "2x ao dia", "antes do treino"
    time_of_day VARCHAR(100), -- manhã, tarde, noite, antes das refeições
    
    instructions TEXT, -- Instruções especiais
    purpose TEXT, -- Para que serve
    
    start_date DATE,
    end_date DATE, -- NULL = uso contínuo
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de histórico de peso e fotos (Minha Jornada)
CREATE TABLE IF NOT EXISTS patient_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Medidas
    weight DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hip_cm DECIMAL(5,2),
    chest_cm DECIMAL(5,2),
    arm_cm DECIMAL(5,2),
    thigh_cm DECIMAL(5,2),
    
    -- Fotos (URLs do storage)
    photos JSONB DEFAULT '[]'::jsonb, -- [{url, type: "front"|"side"|"back", caption}]
    
    -- Notas
    notes TEXT,
    
    -- Referência ao plano ativo naquele momento
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_journey_patient_date ON patient_journey(patient_id, record_date DESC);

-- Tabela de feedbacks do paciente
CREATE TABLE IF NOT EXISTS patient_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    feedback_type VARCHAR(50), -- meal, supplement, general, weight, mood
    
    -- Para feedback de refeição específica
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
    meal_name VARCHAR(255),
    
    -- Conteúdo do feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 estrelas
    comment TEXT,
    
    -- Sintomas ou reações (para feedback de refeição/suplemento)
    symptoms JSONB DEFAULT '[]'::jsonb, -- ["náusea", "energia", "disposição"]
    
    -- Resposta do profissional
    professional_response TEXT,
    responded_at TIMESTAMPTZ,
    
    is_read BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca
CREATE INDEX IF NOT EXISTS idx_feedback_patient ON patient_feedbacks(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_professional ON patient_feedbacks(professional_id, is_read, created_at DESC);

-- Configurações do CTA do projeto (para visitor)
CREATE TABLE IF NOT EXISTS project_cta_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Textos personalizáveis por categoria
    texts JSONB DEFAULT '{
        "magreza": {
            "title": "Precisando ganhar peso de forma saudável?",
            "description": "Com um plano alimentar personalizado, você pode alcançar seu peso ideal com saúde e energia."
        },
        "normal": {
            "title": "Quer manter sua saúde em dia?",
            "description": "Um acompanhamento nutricional pode ajudar você a manter seus resultados e melhorar ainda mais."
        },
        "sobrepeso": {
            "title": "Hora de cuidar da sua saúde!",
            "description": "Com orientação profissional, você pode alcançar seu peso ideal de forma saudável e sustentável."
        },
        "obesidade": {
            "title": "Sua saúde merece atenção especial",
            "description": "Acompanhamento nutricional profissional é essencial para uma mudança segura e eficaz."
        },
        "default": {
            "title": "Quer um plano alimentar personalizado?",
            "description": "Com base nas suas respostas, você pode ter um plano totalmente personalizado."
        }
    }'::jsonb,
    
    -- Links
    whatsapp_number VARCHAR(20),
    whatsapp_message TEXT DEFAULT 'Olá! Acabei de usar a calculadora no FitJourney e gostaria de saber mais sobre o projeto.',
    instagram_url TEXT,
    
    -- Projeto info
    project_name VARCHAR(255) DEFAULT 'Meu Projeto',
    project_description TEXT,
    project_benefits JSONB DEFAULT '[]'::jsonb, -- ["Plano personalizado", "Acompanhamento semanal", ...]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(professional_id)
);

-- RLS Policies
ALTER TABLE patient_menu_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_cta_config ENABLE ROW LEVEL SECURITY;

-- Policies para patient_menu_configs
CREATE POLICY "Profissionais podem gerenciar suas configs de menu"
    ON patient_menu_configs FOR ALL
    USING (professional_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Pacientes podem ver sua config de menu"
    ON patient_menu_configs FOR SELECT
    USING (patient_id = auth.uid() OR (
        patient_id IS NULL AND professional_id IN (
            SELECT professional_id FROM patient_profiles WHERE patient_id = auth.uid()
        )
    ));

-- Policies para recipes
CREATE POLICY "Profissionais podem gerenciar suas receitas"
    ON recipes FOR ALL
    USING (professional_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Pacientes podem ver receitas compartilhadas"
    ON recipes FOR SELECT
    USING (
        is_public = true AND professional_id IN (
            SELECT professional_id FROM patient_profiles WHERE patient_id = auth.uid()
        )
        OR auth.uid() = ANY(visible_to_patients)
    );

-- Policies para patient_supplements
CREATE POLICY "Profissionais podem gerenciar suplementos"
    ON patient_supplements FOR ALL
    USING (professional_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Pacientes podem ver seus suplementos"
    ON patient_supplements FOR SELECT
    USING (patient_id = auth.uid());

-- Policies para patient_journey
CREATE POLICY "Profissionais podem gerenciar jornada dos pacientes"
    ON patient_journey FOR ALL
    USING (professional_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Pacientes podem ver e adicionar à sua jornada"
    ON patient_journey FOR ALL
    USING (patient_id = auth.uid());

-- Policies para patient_feedbacks
CREATE POLICY "Pacientes podem criar e ver seus feedbacks"
    ON patient_feedbacks FOR ALL
    USING (patient_id = auth.uid());

CREATE POLICY "Profissionais podem ver e responder feedbacks"
    ON patient_feedbacks FOR ALL
    USING (professional_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Policies para project_cta_config
CREATE POLICY "Profissionais podem gerenciar config do CTA"
    ON project_cta_config FOR ALL
    USING (professional_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Qualquer um pode ver config do CTA"
    ON project_cta_config FOR SELECT
    USING (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_menu_configs_updated_at') THEN
        CREATE TRIGGER update_patient_menu_configs_updated_at
            BEFORE UPDATE ON patient_menu_configs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recipes_updated_at') THEN
        CREATE TRIGGER update_recipes_updated_at
            BEFORE UPDATE ON recipes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_supplements_updated_at') THEN
        CREATE TRIGGER update_patient_supplements_updated_at
            BEFORE UPDATE ON patient_supplements
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_patient_journey_updated_at') THEN
        CREATE TRIGGER update_patient_journey_updated_at
            BEFORE UPDATE ON patient_journey
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_cta_config_updated_at') THEN
        CREATE TRIGGER update_project_cta_config_updated_at
            BEFORE UPDATE ON project_cta_config
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;
