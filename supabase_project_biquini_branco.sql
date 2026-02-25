-- ============================================
-- PROJETO BIQUÍNI BRANCO - ESTRUTURA DE DADOS
-- ============================================

-- 1) Configuração do Menu do Projeto (por profissional)
CREATE TABLE IF NOT EXISTS project_menu_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  menu_items JSONB DEFAULT '[
    {"id": "plano", "label": "Meu Plano", "route": "/patient/meal-plan", "visible": true, "order": 1, "icon": "Utensils"},
    {"id": "tarefas", "label": "Minhas Tarefas Diárias", "route": "/patient/tarefas", "visible": true, "order": 2, "icon": "CheckSquare"},
    {"id": "feedbacks", "label": "Meus Feedbacks", "route": "/patient/feedbacks", "visible": true, "order": 3, "icon": "MessageCircle"},
    {"id": "receitas", "label": "Minhas Receitas", "route": "/patient/receitas", "visible": true, "order": 4, "icon": "BookOpen"},
    {"id": "lista", "label": "Lista de Compras", "route": "/patient/lista-compras", "visible": true, "order": 5, "icon": "ShoppingCart"},
    {"id": "suplementos", "label": "Suplementos", "route": "/patient/suplementos", "visible": true, "order": 6, "icon": "Pill"},
    {"id": "dicas", "label": "Dicas", "route": "/patient/dicas", "visible": true, "order": 7, "icon": "Lightbulb"},
    {"id": "jornada", "label": "Minha Jornada", "route": "/patient/jornada", "visible": true, "order": 8, "icon": "TrendingUp"}
  ]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Conteúdo da Vitrine do Projeto (CMS simples)
CREATE TABLE IF NOT EXISTS project_showcase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_name TEXT DEFAULT 'Projeto Biquíni Branco',
  content JSONB DEFAULT '{
    "hero": {
      "title": "Projeto Biquíni Branco",
      "subtitle": "Transforme seu corpo e conquiste o biquíni dos seus sonhos em 90 dias",
      "cta_text": "Quero Participar",
      "background_image": ""
    },
    "how_it_works": {
      "title": "Como Funciona",
      "steps": [
        {"icon": "UserCheck", "title": "Avaliação Inicial", "description": "Análise completa do seu perfil e objetivos"},
        {"icon": "Utensils", "title": "Plano Personalizado", "description": "Cardápio sob medida para o seu metabolismo"},
        {"icon": "Activity", "title": "Acompanhamento", "description": "Suporte diário e ajustes constantes"},
        {"icon": "Trophy", "title": "Resultados", "description": "Transformação real em 90 dias"}
      ]
    },
    "plans": [
      {"name": "Mensal", "price": "R$ 297", "duration": "30 dias", "features": ["Plano alimentar", "Checklist diário", "Suporte WhatsApp"]},
      {"name": "Trimestral", "price": "R$ 697", "duration": "90 dias", "features": ["Plano alimentar", "Checklist diário", "Suporte WhatsApp", "Receitas exclusivas"], "highlight": true},
      {"name": "Semestral", "price": "R$ 1197", "duration": "180 dias", "features": ["Plano alimentar", "Checklist diário", "Suporte WhatsApp", "Receitas exclusivas", "Suplementação"]},
      {"name": "Anual", "price": "R$ 1997", "duration": "365 dias", "features": ["Tudo incluso", "Prioridade no atendimento", "Grupo VIP"]}
    ],
    "testimonials": [
      {"name": "Ana Silva", "text": "Perdi 12kg em 3 meses! Melhor investimento da minha vida.", "image": "", "result": "-12kg"},
      {"name": "Carla Santos", "text": "Finalmente consegui usar biquíni com confiança!", "image": "", "result": "-8kg"}
    ],
    "before_after": [
      {"name": "Júlia", "before": "", "after": "", "result": "-15kg em 90 dias"}
    ],
    "faq": [
      {"question": "Como funciona o acompanhamento?", "answer": "Você terá acesso a uma plataforma exclusiva com seu plano, tarefas diárias e suporte direto comigo."},
      {"question": "Preciso malhar?", "answer": "Não é obrigatório, mas atividade física potencializa os resultados."}
    ]
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Programa/Plano do Paciente (data de início, duração, etc)
CREATE TABLE IF NOT EXISTS patient_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id),
  program_type TEXT NOT NULL, -- 'mensal', 'trimestral', 'semestral', 'anual'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Histórico de Peso do Paciente
CREATE TABLE IF NOT EXISTS patient_weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Feedbacks do Paciente (fotos de progresso, comentários)
CREATE TABLE IF NOT EXISTS patient_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id),
  feedback_type TEXT DEFAULT 'progress', -- 'progress', 'question', 'celebration'
  message TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- array de URLs
  weight DECIMAL(5,2),
  date DATE DEFAULT CURRENT_DATE,
  professional_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_menu_professional ON project_menu_config(professional_id);
CREATE INDEX IF NOT EXISTS idx_project_showcase_professional ON project_showcase(professional_id);
CREATE INDEX IF NOT EXISTS idx_patient_program_patient ON patient_program(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_program_professional ON patient_program(professional_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_patient ON patient_weight_history(patient_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_patient ON patient_feedbacks(patient_id, date DESC);

-- RLS (Row Level Security)
ALTER TABLE project_menu_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies: professional/admin acessa tudo
CREATE POLICY "Professional acessa config menu"
  ON project_menu_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'professional')
    )
  );

CREATE POLICY "Professional acessa showcase"
  ON project_showcase FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'professional')
    )
  );

CREATE POLICY "Professional e paciente acessam programa"
  ON patient_program FOR SELECT
  USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'professional')
    )
  );

CREATE POLICY "Professional gerencia programa"
  ON patient_program FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'professional')
    )
  );

CREATE POLICY "Paciente vê seu histórico"
  ON patient_weight_history FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Professional vê histórico"
  ON patient_weight_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'professional')
    )
  );

CREATE POLICY "Paciente vê e cria feedbacks"
  ON patient_feedbacks FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Paciente insere feedback"
  ON patient_feedbacks FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Professional gerencia feedbacks"
  ON patient_feedbacks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'professional')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_menu_config_updated_at
  BEFORE UPDATE ON project_menu_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_showcase_updated_at
  BEFORE UPDATE ON project_showcase
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_program_updated_at
  BEFORE UPDATE ON patient_program
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed inicial (apenas se não existir)
INSERT INTO project_showcase (id, professional_id, project_name)
SELECT gen_random_uuid(), NULL, 'Projeto Biquíni Branco'
WHERE NOT EXISTS (SELECT 1 FROM project_showcase LIMIT 1);

COMMENT ON TABLE project_menu_config IS 'Configuração editável do menu Meu Projeto (por profissional)';
COMMENT ON TABLE project_showcase IS 'Conteúdo da vitrine do projeto (CMS simples white-label)';
COMMENT ON TABLE patient_program IS 'Programa/plano do paciente com datas de início e fim';
COMMENT ON TABLE patient_weight_history IS 'Histórico de pesagens do paciente';
COMMENT ON TABLE patient_feedbacks IS 'Feedbacks e fotos de progresso do paciente';
