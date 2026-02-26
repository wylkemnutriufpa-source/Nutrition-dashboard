-- =====================================================
-- CONFIGURAÇÃO DO STORAGE PARA BRANDING
-- =====================================================
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. Criar bucket para branding (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acesso ao bucket branding
-- Permitir que profissionais façam upload de logos

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "branding_upload" ON storage.objects;
DROP POLICY IF EXISTS "branding_select" ON storage.objects;
DROP POLICY IF EXISTS "branding_update" ON storage.objects;
DROP POLICY IF EXISTS "branding_delete" ON storage.objects;

-- Profissionais podem fazer upload
CREATE POLICY "branding_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'branding' 
    AND auth.uid() IN (
      SELECT user_id FROM professional_profiles
    )
  );

-- Todos podem visualizar (bucket público)
CREATE POLICY "branding_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'branding');

-- Profissionais podem atualizar seus próprios arquivos
CREATE POLICY "branding_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'branding'
    AND auth.uid() IN (
      SELECT user_id FROM professional_profiles
    )
  );

-- Profissionais podem deletar seus próprios arquivos
CREATE POLICY "branding_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'branding'
    AND auth.uid() IN (
      SELECT user_id FROM professional_profiles
    )
  );
