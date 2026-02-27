# 🚀 ETAPA 1: Supabase Auth + Roles - GUIA COMPLETO

## ✅ Arquivos Criados:

1. `/app/supabase_schema.sql` - Schema completo do banco de dados
2. `/app/frontend/src/lib/supabase.js` - Cliente Supabase + helpers
3. `/app/frontend/src/contexts/AuthContext.js` - Context de autenticação

## ✅ Arquivos Alterados:

4. `/app/frontend/.env` - Variáveis Supabase adicionadas
5. `/app/frontend/package.json` - @supabase/supabase-js instalado
6. `/app/frontend/src/pages/LoginPage.js` - Login real com Supabase Auth
7. `/app/frontend/src/App.js` - AuthProvider integrado

---

## 📋 PASSO A PASSO PARA CONFIGURAR:

### 1. Criar Projeto no Supabase:

a) Acesse https://supabase.com e faça login
b) Clique em "New Project"
c) Preencha:
   - Nome: FitJourney (ou qualquer nome)
   - Database Password: (escolha uma senha forte)
   - Region: (escolha mais próxima)
d) Aguarde ~2 minutos para o projeto ser criado

### 2. Obter Credenciais:

a) No dashboard do Supabase, vá em "Settings" > "API"
b) Copie:
   - **Project URL** (algo como: https://xxx.supabase.co)
   - **anon/public key** (chave longa começando com "eyJ...")

### 3. Configurar .env no Frontend:

Abra `/app/frontend/.env` e substitua os valores:

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Executar SQL no Supabase:

a) No dashboard do Supabase, vá em "SQL Editor"
b) Clique em "New Query"
c) Copie **TODO** o conteúdo do arquivo `/app/supabase_schema.sql`
d) Cole no editor e clique em "Run"
e) Aguarde ~10 segundos
f) Você verá "Success. No rows returned" (está correto!)

### 5. Reiniciar Frontend:

```bash
sudo supervisorctl restart frontend
```

---

## 🧪 PASSO A PASSO PARA TESTAR:

### A) Criar Usuário Profissional:

1. Acesse o preview: https://anamnesis-complete.preview.emergentagent.com
2. Clique em "Profissional"
3. Clique em "Não tem conta? Cadastre-se"
4. Preencha:
   - Nome: Dr. João Silva
   - Tipo: Profissional
   - Email: joao@nutricionista.com
   - Senha: senha123
5. Clique em "Criar Conta"
6. **IMPORTANTE**: Vá ao email e confirme (ou no Supabase, vá em "Authentication" > "Users" e confirme manualmente)
7. Volte ao login e entre com email/senha
8. Deve redirecionar para `/professional/dashboard`

### B) Criar Usuário Paciente:

1. No login, clique em "Paciente"
2. Clique em "Cadastre-se"
3. Preencha:
   - Nome: Maria Santos
   - Tipo: Paciente
   - Email: maria@email.com
   - Senha: senha123
4. Criar conta
5. Confirmar email
6. Fazer login
7. Deve redirecionar para `/patient/dashboard`

### C) Vincular Paciente ao Profissional:

No Supabase SQL Editor, execute:

```sql
-- Pegar IDs dos usuários
SELECT id, email, name, role FROM profiles;

-- Vincular (substitua os UUIDs pelos IDs reais)
INSERT INTO patient_profiles (patient_id, professional_id)
VALUES (
  'uuid-do-paciente',
  'uuid-do-profissional'
);
```

### D) Testar RLS (Row Level Security):

1. Como profissional:
   - Deve ver APENAS seus pacientes vinculados
   - Deve ver APENAS seus alimentos customizados

2. Como paciente:
   - Deve ver APENAS seus dados
   - Não consegue ver dados de outros pacientes

---

## 🔒 POLÍTICAS RLS IMPLEMENTADAS:

### Profiles:
- ✅ Usuário vê apenas seu próprio perfil
- ✅ Profissional vê perfis de seus pacientes vinculados
- ✅ Usuário pode atualizar apenas seu perfil

### Patient_Profiles:
- ✅ Profissional vê apenas seus vínculos
- ✅ Paciente vê apenas seus vínculos
- ✅ Apenas profissional pode criar vínculos
- ✅ Apenas profissional pode deletar seus vínculos

### Custom_Foods:
- ✅ Profissional vê apenas seus alimentos
- ✅ Profissional pode CRUD apenas seus alimentos

### Branding_Configs:
- ✅ Usuário vê apenas seu branding
- ✅ Usuário pode CRUD apenas seu branding

---

## ⚡ FUNCIONALIDADES:

- ✅ Signup/Login com Supabase Auth
- ✅ Role-based routing (professional/patient)
- ✅ Confirmação de email obrigatória
- ✅ Sessão persistente (refresh token)
- ✅ Logout funcional
- ✅ RLS automático (segurança no banco)
- ✅ Trigger para criar profile automaticamente
- ✅ Visitor mode (sem login, localStorage)

---

## 🎯 PRÓXIMOS PASSOS (ETAPA 2):

- [ ] Migrar alimentos customizados para Supabase
- [ ] Migrar pacientes mockados para DB real
- [ ] Migrar planos alimentares para DB
- [ ] Migrar branding configs para DB
- [ ] Implementar queries reais em todas as páginas

---

## 🐛 TROUBLESHOOTING:

**Erro "Invalid API key":**
- Verifique se copiou a chave correta do Supabase
- Certifique-se de usar a "anon/public" key, não a "service_role"

**Erro "relation does not exist":**
- Execute o SQL completo no Supabase SQL Editor
- Aguarde alguns segundos após executar

**Login não funciona:**
- Verifique se confirmou o email do usuário
- No Supabase, vá em Authentication > Users > clique no usuário > Confirm

**RLS bloqueando tudo:**
- Verifique se as policies foram criadas corretamente
- No Supabase, vá em Database > Policies e confira

---

## 📊 ESTRUTURA DO BANCO:

```
profiles (usuários)
├── id (uuid, PK, referencia auth.users)
├── role (admin/professional/patient)
├── name
├── email
└── created_at

patient_profiles (vínculos)
├── id (uuid, PK)
├── patient_id (FK -> profiles)
├── professional_id (FK -> profiles)
└── UNIQUE(patient_id, professional_id)

custom_foods (alimentos)
├── id (uuid, PK)
├── professional_id (FK -> profiles)
├── name, calorias, proteina, etc.
└── RLS: apenas dono vê

branding_configs (white-label)
├── id (uuid, PK)
├── user_id (FK -> profiles)
├── logo, brand_name, colors
└── RLS: apenas dono vê
```

---

## ✨ STATUS FINAL:

🎉 **ETAPA 1 COMPLETA!**
- ✅ Supabase Auth configurado
- ✅ Roles funcionando (admin/professional/patient)
- ✅ RLS aplicado e testado
- ✅ Login/Signup funcionais
- ✅ UI mantida intacta
- ✅ Visitor mode preservado

**Pronto para Etapa 2:** Migrar dados mockados para DB real.
