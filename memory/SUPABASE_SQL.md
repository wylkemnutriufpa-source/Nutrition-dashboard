# SQLs para Executar no Supabase

Execute esses scripts no Supabase SQL Editor (Dashboard → SQL Editor).

---

## SQL 1: Corrigir project_showcase (OBRIGATÓRIO para salvar o editor)

```sql
-- Habilitar RLS na tabela
ALTER TABLE project_showcase ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas para evitar conflito
DROP POLICY IF EXISTS "Public can read project_showcase" ON project_showcase;
DROP POLICY IF EXISTS "Authenticated can insert project_showcase" ON project_showcase;
DROP POLICY IF EXISTS "Authenticated can update project_showcase" ON project_showcase;
DROP POLICY IF EXISTS "Everyone can read project_showcase" ON project_showcase;
DROP POLICY IF EXISTS "Authenticated can write project_showcase" ON project_showcase;

-- Criar policies corretas
CREATE POLICY "Public can read project_showcase"
  ON project_showcase FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert project_showcase"
  ON project_showcase FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update project_showcase"
  ON project_showcase FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserir linha padrão se não existir
INSERT INTO project_showcase (project_key, config)
SELECT 'biquini_branco', '{}'
WHERE NOT EXISTS (
  SELECT 1 FROM project_showcase WHERE project_key = 'biquini_branco'
);
```

---

## SQL 2: Adicionar coluna de foto de perfil (para upload de foto do paciente)

```sql
-- Adicionar coluna photo_url na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
```

---

## SQL 3: Criar bucket de Storage para fotos de perfil (opcional, melhora performance)

No painel do Supabase, vá em **Storage** → **New Bucket**:
- Nome: `profile-photos`
- Marcar como **Public bucket**: SIM

Depois execute no SQL Editor:
```sql
-- Policy para permitir qualquer usuário autenticado fazer upload
CREATE POLICY "Users can upload own profile photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

-- Policy para leitura pública
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Policy para usuário atualizar sua própria foto
CREATE POLICY "Users can update own profile photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos');
```

> **Nota:** Se não criar o bucket, o upload ainda funciona via base64 (armazenado diretamente na tabela profiles). É funcional mas consome mais espaço no banco.

---

## SQL 4: Verificar/Corrigir RLS do patient_journey (se der erro 406)

```sql
-- Verificar se RLS está ativado
ALTER TABLE patient_journey ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own journey" ON patient_journey;
DROP POLICY IF EXISTS "Professionals can manage journey" ON patient_journey;
DROP POLICY IF EXISTS "All authenticated can access journey" ON patient_journey;

CREATE POLICY "All authenticated can access journey"
  ON patient_journey FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## SQL 5: Verificar/Corrigir RLS do weight_history

```sql
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated can access weight_history" ON weight_history;

CREATE POLICY "All authenticated can access weight_history"
  ON weight_history FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```
