-- =====================================================
-- P1-1: SISTEMA DE NOTIFICAÇÕES
-- =====================================================
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'feedback', 'progress', 'appointment', 'message'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- URL para onde a notificação leva
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Dados extras (ex: patient_id, feedback_id, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

-- Usuário vê apenas suas próprias notificações
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Sistema pode criar notificações (via triggers ou backend)
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (true);

-- Usuário pode marcar como lida
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Usuário pode deletar suas notificações
CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- 5. Função para criar notificação quando paciente envia feedback
CREATE OR REPLACE FUNCTION notify_feedback_created()
RETURNS TRIGGER AS $$
DECLARE
  prof_user_id UUID;
  patient_name TEXT;
BEGIN
  -- Buscar o user_id do profissional e nome do paciente
  SELECT 
    prof.user_id,
    pat.name
  INTO 
    prof_user_id,
    patient_name
  FROM patient_profiles pp
  JOIN profiles prof ON pp.professional_id = prof.id
  JOIN profiles pat ON pp.patient_id = pat.id
  WHERE pp.patient_id = NEW.patient_id;

  -- Criar notificação para o profissional
  IF prof_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      prof_user_id,
      'feedback',
      'Novo Feedback',
      patient_name || ' enviou um feedback',
      '/professional/patients/' || NEW.patient_id,
      jsonb_build_object('patient_id', NEW.patient_id, 'message_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para feedbacks
DROP TRIGGER IF EXISTS trigger_feedback_notification ON patient_messages;
CREATE TRIGGER trigger_feedback_notification
  AFTER INSERT ON patient_messages
  FOR EACH ROW
  WHEN (NEW.sender = 'patient')
  EXECUTE FUNCTION notify_feedback_created();

-- 7. Função para notificar quando paciente atualiza progresso (peso)
CREATE OR REPLACE FUNCTION notify_progress_updated()
RETURNS TRIGGER AS $$
DECLARE
  prof_user_id UUID;
  patient_name TEXT;
BEGIN
  -- Buscar o user_id do profissional e nome do paciente
  SELECT 
    prof.user_id,
    pat.name
  INTO 
    prof_user_id,
    patient_name
  FROM patient_profiles pp
  JOIN profiles prof ON pp.professional_id = prof.id
  JOIN profiles pat ON pp.patient_id = pat.id
  WHERE pp.patient_id = NEW.patient_id;

  -- Criar notificação apenas para novos registros de peso
  IF prof_user_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      prof_user_id,
      'progress',
      'Progresso Atualizado',
      patient_name || ' registrou novo peso: ' || NEW.weight || 'kg',
      '/professional/patients/' || NEW.patient_id,
      jsonb_build_object('patient_id', NEW.patient_id, 'journey_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para progresso
DROP TRIGGER IF EXISTS trigger_progress_notification ON patient_journey;
CREATE TRIGGER trigger_progress_notification
  AFTER INSERT ON patient_journey
  FOR EACH ROW
  WHEN (NEW.weight IS NOT NULL)
  EXECUTE FUNCTION notify_progress_updated();

-- =====================================================
-- FIM P1-1
-- =====================================================
