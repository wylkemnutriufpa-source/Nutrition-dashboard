-- ============================================
-- CALENDAR EVENTS - AGENDA INTERATIVA
-- Sistema de eventos para agenda do paciente e profissional
-- ============================================

-- Criar tabela calendar_events
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    end_time TIME,
    event_type VARCHAR(50) DEFAULT 'reminder',
    -- Tipos: 'reminder', 'appointment', 'feedback', 'meal_reminder', 'supplement', 'exercise', 'custom'
    color VARCHAR(20) DEFAULT '#14b8a6',
    is_all_day BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    reminder_before INTEGER DEFAULT 30, -- minutos antes para lembrar
    created_by VARCHAR(20) DEFAULT 'patient', -- 'patient' ou 'professional'
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_calendar_events_patient ON calendar_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_professional ON calendar_events(professional_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- RLS (Row Level Security)
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Pacientes podem ver e gerenciar seus próprios eventos
CREATE POLICY "Patients can view their events" ON calendar_events
    FOR SELECT
    USING (patient_id = auth.uid());

CREATE POLICY "Patients can insert their events" ON calendar_events
    FOR INSERT
    WITH CHECK (
        patient_id = auth.uid() AND created_by = 'patient'
    );

CREATE POLICY "Patients can update their events" ON calendar_events
    FOR UPDATE
    USING (patient_id = auth.uid())
    WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can delete their events" ON calendar_events
    FOR DELETE
    USING (
        patient_id = auth.uid() AND created_by = 'patient'
    );

-- Profissionais podem ver eventos dos seus pacientes
CREATE POLICY "Professionals can view patient events" ON calendar_events
    FOR SELECT
    USING (
        professional_id = auth.uid() OR
        patient_id IN (
            SELECT id FROM profiles WHERE professional_id = auth.uid()
        )
    );

-- Profissionais podem criar eventos para pacientes
CREATE POLICY "Professionals can insert events for patients" ON calendar_events
    FOR INSERT
    WITH CHECK (
        professional_id = auth.uid()
    );

-- Profissionais podem atualizar eventos que criaram
CREATE POLICY "Professionals can update their events" ON calendar_events
    FOR UPDATE
    USING (
        professional_id = auth.uid() OR
        (created_by = 'professional' AND professional_id = auth.uid())
    );

-- Profissionais podem deletar eventos que criaram
CREATE POLICY "Professionals can delete their events" ON calendar_events
    FOR DELETE
    USING (
        professional_id = auth.uid() AND created_by = 'professional'
    );

-- Admins podem tudo
CREATE POLICY "Admins can do everything with events" ON calendar_events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER trigger_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_events_updated_at();

-- Comentários
COMMENT ON TABLE calendar_events IS 'Eventos de agenda para pacientes e profissionais';
COMMENT ON COLUMN calendar_events.event_type IS 'Tipo do evento: reminder, appointment, feedback, meal_reminder, supplement, exercise, custom';
COMMENT ON COLUMN calendar_events.created_by IS 'Quem criou: patient ou professional';
COMMENT ON COLUMN calendar_events.reminder_before IS 'Minutos antes para enviar lembrete';
