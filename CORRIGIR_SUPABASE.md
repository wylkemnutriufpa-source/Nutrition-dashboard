# 🔧 CORREÇÃO FINAL - Sincronizar Auth e Profiles no Supabase

## 🎯 PROBLEMA IDENTIFICADO:

**409 Conflict** ao criar paciente significa:
- Usuário existe em `auth.users` 
- MAS `public.profiles` tem registro com mesmo email e ID diferente
- Resultado: conflito ao tentar inserir

---

## ✅ SOLUÇÃO: Executar SQL no Supabase

### **Passo 1: Abrir Supabase SQL Editor**
1. Ir em https://supabase.com/dashboard
2. Selecionar projeto: `safovouvjiikaickutvi`
3. Clicar em **SQL Editor** (ícone terminal no menu lateral)

---

### **Passo 2: Executar Script de Correção**

Cole e execute este SQL (substitua os emails):

```sql
-- ================================================
-- SCRIPT DE CORREÇÃO: Sincronizar auth.users com profiles
-- ================================================

-- 1) Ver todos os usuários auth
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2) Ver profiles existentes
SELECT id, email, name, role, status
FROM public.profiles
ORDER BY created_at DESC;

-- 3) LIMPAR profiles órfãos (sem correspondente em auth.users)
UPDATE public.profiles
SET status = 'inactive', updated_at = now()
WHERE id NOT IN (SELECT id FROM auth.users);

-- 4) SINCRONIZAR para cada usuário existente
-- Substitua 'EMAIL_AQUI' pelo email real

INSERT INTO public.profiles (id, email, name, role, status, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name',''), 'Usuário'),
    CASE 
        WHEN LOWER(u.email) LIKE '%admin%' THEN 'admin'
        WHEN LOWER(u.email) LIKE '%prof%' THEN 'professional'
        ELSE 'visitor'
    END,
    'active',
    NOW(),
    NOW()
FROM auth.users u
WHERE LOWER(u.email) = LOWER('EMAIL_AQUI')
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();
```

---

### **Passo 3: Corrigir SEU usuário admin**

Execute substituindo seu email real:

```sql
-- Corrigir o admin (você)
INSERT INTO public.profiles (id, email, name, role, status, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    'Administrador',
    'admin',
    'active',
    NOW(),
    NOW()
FROM auth.users u
WHERE LOWER(u.email) = LOWER('wylkem.nutri.ufpa@gmail.com')
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    name = 'Administrador',
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- Verificar
SELECT * FROM public.profiles WHERE email = 'wylkem.nutri.ufpa@gmail.com';
```

---

### **Passo 4: Limpar profiles duplicados**

Se houver profiles com mesmo email mas ID diferente:

```sql
-- Ver duplicados
SELECT email, COUNT(*), ARRAY_AGG(id)
FROM public.profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Desativar duplicados (manter apenas o que está em auth.users)
UPDATE public.profiles
SET status = 'inactive', updated_at = NOW()
WHERE id NOT IN (SELECT id FROM auth.users)
AND status = 'active';
```

---

### **Passo 5: Garantir Unique Constraint**

```sql
-- Adicionar constraint para evitar duplicação
-- (só se não existir)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_key UNIQUE (email);
```

**Se der erro "already exists"**: OK, constraint já existe!

---

## 🧪 APÓS EXECUTAR OS SQLs:

1. **Limpar cache do navegador**
   - F12 → Application → Clear site data
   - Ctrl+Shift+R

2. **Fazer logout e login novamente**

3. **Tentar criar paciente**
   - Use EMAIL NOVO que nunca foi cadastrado
   - Exemplo: `paciente.teste@email.com`

4. **Deve funcionar!** ✅

---

## 📊 VERIFICAÇÕES FINAIS:

```sql
-- 1. Quantos usuários auth?
SELECT COUNT(*) FROM auth.users;

-- 2. Quantos profiles ativos?
SELECT COUNT(*) FROM public.profiles WHERE status = 'active';

-- 3. Verificar se IDs batem
SELECT 
    u.id as auth_id,
    u.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

**Resultado esperado**: Cada linha deve ter `auth_id = profile_id`

---

## ⚠️ SE AINDA DER ERRO 409:

Significa que o email que você está tentando usar JÁ EXISTE em `profiles`. 

**Opções:**
1. Use email diferente
2. Delete o profile antigo:
   ```sql
   DELETE FROM public.profiles 
   WHERE email = 'email@problema.com' 
   AND id NOT IN (SELECT id FROM auth.users);
   ```

---

## 🎯 RESUMO:

1. ✅ Execute SQLs no Supabase SQL Editor
2. ✅ Sincronize seu admin
3. ✅ Limpe duplicados
4. ✅ Faça logout/login
5. ✅ Crie paciente com email novo

**Depois disso, o sistema vai funcionar perfeitamente!** 🚀
