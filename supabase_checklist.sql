-- Tabela simples de checklist para MVP
CREATE TABLE IF NOT EXISTS checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar tarefas por paciente
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_patient_id ON checklist_tasks(patient_id);

-- RLS básica
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;

-- Paciente vê apenas suas tarefas
CREATE POLICY "Pacientes veem suas tarefas" 
  ON checklist_tasks FOR SELECT 
  USING (patient_id = auth.uid());

-- Paciente pode atualizar (marcar/desmarcar)
CREATE POLICY "Pacientes atualizam suas tarefas" 
  ON checklist_tasks FOR UPDATE 
  USING (patient_id = auth.uid());

-- Admin e profissional podem fazer tudo
CREATE POLICY "Admin e profissional acesso total" 
  ON checklist_tasks FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'professional')
    )
  );
