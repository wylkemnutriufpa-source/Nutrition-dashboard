-- SQL para criar tabela de Branding no Supabase
-- Execute este script no Supabase SQL Editor se quiser persistir no banco

CREATE TABLE IF NOT EXISTS branding_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT UNIQUE,
    user_type TEXT CHECK (user_type IN ('ADMIN', 'PROFESSIONAL')),
    logo TEXT,
    brand_name TEXT NOT NULL DEFAULT 'FitJourney',
    primary_color TEXT NOT NULL DEFAULT '#0F766E',
    accent_color TEXT NOT NULL DEFAULT '#059669',
    footer_text TEXT DEFAULT 'Sua jornada para uma vida mais saudável',
    welcome_message TEXT DEFAULT 'Bem-vindo ao seu painel de nutrição',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar por email rapidamente
CREATE INDEX idx_branding_user_email ON branding_configs(user_email);

-- Políticas RLS (Row Level Security)
ALTER TABLE branding_configs ENABLE ROW LEVEL SECURITY;

-- Admin pode ver e editar tudo
CREATE POLICY "Admin can view all branding" ON branding_configs
    FOR SELECT
    USING (user_type = 'ADMIN');

CREATE POLICY "Admin can update all branding" ON branding_configs
    FOR UPDATE
    USING (user_type = 'ADMIN');

-- Profissional pode ver e editar apenas seu próprio branding
CREATE POLICY "Professional can view own branding" ON branding_configs
    FOR SELECT
    USING (user_email = auth.jwt() ->> 'email' AND user_type = 'PROFESSIONAL');

CREATE POLICY "Professional can update own branding" ON branding_configs
    FOR UPDATE
    USING (user_email = auth.jwt() ->> 'email' AND user_type = 'PROFESSIONAL');

CREATE POLICY "Professional can insert own branding" ON branding_configs
    FOR INSERT
    WITH CHECK (user_email = auth.jwt() ->> 'email' AND user_type = 'PROFESSIONAL');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branding_configs_updated_at BEFORE UPDATE
    ON branding_configs FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Inserir branding global padrão (ADM)
INSERT INTO branding_configs (user_email, user_type, brand_name, primary_color, accent_color, footer_text, welcome_message)
VALUES (NULL, 'ADMIN', 'FitJourney', '#0F766E', '#059669', 'Sua jornada para uma vida mais saudável', 'Bem-vindo ao seu painel de nutrição')
ON CONFLICT (user_email) DO NOTHING;
