# 🔍 DIAGNÓSTICO E CORREÇÃO - Erro 406 Supabase

## ❌ ERRO IDENTIFICADO:

```
Failed to load resource: the server responded with a status of 406 ()
GET /rest/v1/profiles?select=*&id=eq.177ff33f-f573-4a9c-aca1-1e4c55d94ece
```

**Tradução**: O login funcionou ✅, mas ao buscar o perfil do usuário, o Supabase retornou erro 406.

---

## 🔍 CAUSA RAIZ:

**Erro 406 (Not Acceptable)** do Supabase significa uma das seguintes:

1. ❌ **Perfil não existe** na tabela `profiles` (mais provável)
2. ❌ **RLS bloqueando** o acesso ao perfil
3. ❌ **Trigger não funcionou** ao criar usuário no auth

---

## ✅ CORREÇÕES IMPLEMENTADAS:

### 1. **getUserProfile Melhorado** (`supabase.js`)
```javascript
// ANTES: Falhava silenciosamente
export const getUserProfile = async (userId) => {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data || null;
}

// DEPOIS: Cria perfil automaticamente se não existir
export const getUserProfile = async (userId) => {
  console.log('🔍 Buscando profile...');
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  
  if (!data) {
    console.warn('⚠️ Profile não encontrado, criando automaticamente...');
    return await createMissingProfile(user);
  }
  
  return data;
}
```

**Benefícios:**
- ✅ Logs detalhados para debugging
- ✅ Cria perfil automaticamente se não existir
- ✅ Usa `maybeSingle()` ao invés de `single()` (não lança erro)
- ✅ Tratamento robusto de erro 406

### 2. **AuthContext Otimizado**
```javascript
// Ignorar evento INITIAL_SESSION (já chamamos checkUser())
if (event === 'INITIAL_SESSION') {
  return;
}
```

**Benefícios:**
- ✅ Reduz eventos duplicados no console
- ✅ Evita chamadas desnecessárias ao Supabase

### 3. **Script de Diagnóstico SQL** (`supabase_diagnostico.sql`)
- ✅ Verificar usuários sem perfil
- ✅ Criar perfil manualmente se necessário
- ✅ Atualizar role para admin
- ✅ Verificar políticas RLS

---

## 🧪 PASSO A PASSO DE CORREÇÃO:

### **OPÇÃO 1: Deixar a Aplicação Criar Automaticamente** (Mais Fácil)

1. **Limpar cache do navegador**:
   - F12 → Application → Storage → Clear site data
   - Ctrl+Shift+R para reload

2. **Fazer login novamente**:
   - Tentar login como admin
   - Verificar no console:
     ```
     🔍 Buscando profile para userId: 177ff33f-...
     ⚠️ Profile não encontrado ou bloqueado por RLS
     🔧 Tentando criar profile automaticamente...
     🆕 Criando profile para: seu@email.com
     ✅ Profile criado com sucesso
     ```

3. **Se criar com role 'visitor'**:
   - Ir no Supabase SQL Editor
   - Executar:
     ```sql
     UPDATE profiles 
     SET role = 'admin' 
     WHERE email = 'seu@email.com';
     ```

4. **Fazer logout e login novamente**

---

### **OPÇÃO 2: Criar Perfil Manualmente no Supabase** (Mais Confiável)

1. **Abrir Supabase Dashboard**: https://supabase.com/dashboard

2. **Ir em SQL Editor** (ícone de terminal)

3. **Executar este SQL** (substitua o email):
   ```sql
   -- Ver usuários auth
   SELECT id, email FROM auth.users WHERE email = 'SEU_EMAIL_ADMIN@example.com';
   
   -- Ver se perfil já existe
   SELECT * FROM profiles WHERE email = 'SEU_EMAIL_ADMIN@example.com';
   
   -- Se não existir, criar:
   INSERT INTO profiles (id, email, name, role, created_at)
   SELECT 
       id,
       email,
       'Administrador', -- Nome
       'admin',         -- Role
       NOW()
   FROM auth.users
   WHERE email = 'SEU_EMAIL_ADMIN@example.com'
   AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.email = 'SEU_EMAIL_ADMIN@example.com');
   
   -- Se já existe mas role errada, atualizar:
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'SEU_EMAIL_ADMIN@example.com';
   ```

4. **Verificar resultado**:
   ```sql
   SELECT * FROM profiles WHERE email = 'SEU_EMAIL_ADMIN@example.com';
   ```
   
   Deve mostrar:
   ```
   id: 177ff33f-f573-4a9c-aca1-1e4c55d94ece
   email: seu@email.com
   name: Administrador
   role: admin
   ```

5. **Limpar cache e fazer login novamente**

---

### **OPÇÃO 3: Verificar/Corrigir RLS**

Se o perfil existe mas erro 406 persiste, pode ser RLS bloqueando:

1. **Verificar políticas RLS**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

2. **Criar política se não existir**:
   ```sql
   -- Permitir usuário ver próprio perfil
   CREATE POLICY "Users can view own profile"
   ON profiles FOR SELECT
   USING (auth.uid() = id);
   
   -- Permitir usuário atualizar próprio perfil
   CREATE POLICY "Users can update own profile"
   ON profiles FOR UPDATE
   USING (auth.uid() = id);
   ```

3. **Se continuar não funcionando, desabilitar RLS temporariamente** (apenas para teste):
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```
   
   **⚠️ IMPORTANTE**: Isso remove toda segurança da tabela! Apenas para testes.
   
   Depois de testar, reabilitar:
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ```

---

## 📊 O QUE VERIFICAR NO CONSOLE AGORA:

### ✅ **Logs ESPERADOS após correção:**
```
🔍 Buscando profile para userId: 177ff33f-f573-4a9c-aca1-1e4c55d94ece
✅ Profile encontrado: seu@email.com Role: admin
🔐 Auth event: SIGNED_IN
```

### ❌ **Erros que NÃO devem aparecer:**
```
Failed to load resource: 406
NavigatorLockAcquireTimeoutError
Error: A listener indicated an asynchronous response...
```

---

## 🎯 DEPOIS DA CORREÇÃO:

1. **Limpar cache do navegador** (SEMPRE!)
2. **Fazer login**
3. **Verificar console** - deve ter apenas logs ✅ verdes
4. **Navegar pelo sistema** - sem erros
5. **Reportar resultado**

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS:

1. ✅ `/app/frontend/src/lib/supabase.js` - getUserProfile melhorado
2. ✅ `/app/frontend/src/contexts/AuthContext.js` - eventos otimizados
3. ✅ `/app/supabase_diagnostico.sql` - queries de diagnóstico

---

## 💡 RESUMO SIMPLES:

1. **Problema**: Usuário existe no auth, mas perfil não existe em `profiles`
2. **Causa**: Trigger não funcionou ou usuário criado antes do trigger
3. **Solução**: Criar perfil manualmente no Supabase ou deixar app criar automaticamente
4. **Importante**: Definir `role = 'admin'` para usuário administrador

---

**🚀 Por favor, siga uma das opções acima e me informe:**
- Qual opção você escolheu?
- Conseguiu criar/encontrar o perfil?
- Login funcionou depois?
- Ainda há erros no console?

Aguardo seu feedback! 🙏
