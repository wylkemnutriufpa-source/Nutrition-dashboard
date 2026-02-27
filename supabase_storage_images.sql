-- =====================================================
-- CONFIGURAR STORAGE PARA IMAGENS
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Criar bucket de imagens (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 
  'images', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- 2. Políticas de acesso ao bucket
DROP POLICY IF EXISTS "Permitir upload autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Permitir visualização pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deletar próprios arquivos" ON storage.objects;

-- Permitir upload para usuários autenticados
CREATE POLICY "Permitir upload autenticado" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

-- Permitir visualização pública
CREATE POLICY "Permitir visualização pública" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

-- Permitir deletar para profissionais/admin
CREATE POLICY "Permitir deletar arquivos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'images' 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);

-- Permitir atualizar para profissionais/admin
CREATE POLICY "Permitir atualizar arquivos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images')
WITH CHECK (
  bucket_id = 'images'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professional', 'admin'))
);
