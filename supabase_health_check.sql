-- Tabela para salvar respostas do Check Nutricional
CREATE TABLE IF NOT EXISTS health_check_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do visitante (opcional, só após captura de lead)
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  
  -- Respostas do quiz
  symptoms TEXT[], -- array de sintomas selecionados
  duration TEXT, -- há quanto tempo sente
  routine TEXT, -- nível de atividade física
  sleep_quality TEXT, -- qualidade do sono
  recent_exams TEXT, -- se fez exames
  
  -- Resultado gerado
  alerts JSONB, -- alertas gerados pela lógica
  score INTEGER, -- score de saúde (0-100)
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_to_lead BOOLEAN DEFAULT FALSE, -- se virou lead
  pdf_downloaded BOOLEAN DEFAULT FALSE -- se baixou PDF
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_health_check_email ON health_check_responses(visitor_email);
CREATE INDEX IF NOT EXISTS idx_health_check_created ON health_check_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_check_converted ON health_check_responses(converted_to_lead);

-- RLS: público pode INSERT (anônimo), admin/professional podem ver tudo
ALTER TABLE health_check_responses ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode criar (anônimo)
CREATE POLICY "Público pode criar health check"
  ON health_check_responses FOR INSERT
  WITH CHECK (true);

-- Admin e professional podem ver todos
CREATE POLICY "Admin e professional veem tudo"
  ON health_check_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'professional')
    )
  );

-- Comentário explicativo
COMMENT ON TABLE health_check_responses IS 'Armazena respostas do Check Nutricional Inteligente para geração de leads';
