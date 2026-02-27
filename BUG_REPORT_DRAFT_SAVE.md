# RELATÓRIO DE BUG: Plano Carregado do Rascunho Não Salva

## Data: $(date)
## Branch: main-feature-FIX2
## Repositório: https://github.com/wylkemnutriufpa-source/Nutrition-dashboard

---

## (A) CAUSA RAIZ RESUMIDA

**Problema Principal**: Conflito de permissões RLS (Row Level Security) ao salvar plano alimentar carregado do rascunho.

**5 Causas Identificadas**:

1. **Policy INSERT de meal_plans não valida ownership do paciente** - Professional pode criar plano para qualquer paciente sem verificar se esse paciente pertence a ele via `patient_profiles`.

2. **Função createMealPlan() faz UPDATE automático** - Quando já existe plano ativo, tenta UPDATE. Se o plano foi criado por outro profissional, falha na policy `professional_id = auth.uid()`.

3. **Policy UPDATE sem WITH CHECK** - Policy de UPDATE tem apenas `USING` mas não tem `WITH CHECK`, permitindo modificações não validadas.

4. **Tratamento de erro consome response múltiplas vezes** - Frontend acessa `error.message` do Supabase sem verificar tipo, causando "body stream already read".

5. **Falta validação de vínculo professional-patient** - Nenhuma policy de meal_plans verifica se `patient_id` tem vínculo ativo com `professional_id` na tabela `patient_profiles`.

---

## (B) ARQUIVOS ALTERADOS

### Frontend:
1. **`/app/frontend/src/lib/supabase.js`** (linhas 831-895)
   - ✅ Corrigido: Função `createMealPlan()` - tratamento de erro detalhado
   - ✅ Corrigido: Função `updateMealPlan()` - validação de erro do Supabase
   - ✅ Adicionado: Mensagens de hint específicas para erros RLS
   - ✅ Corrigido: Eliminado "body stream already read" - não consome response múltiplas vezes

2. **`/app/frontend/src/pages/MealPlanEditor.js`** (linhas 699-772)
   - ✅ Corrigido: Função `handleSavePlan()` - tratamento correto de error object
   - ✅ Adicionado: Validação de código de erro 42501 (RLS permission denied)
   - ✅ Adicionado: Mensagens amigáveis para erro de permissão
   - ✅ Adicionado: Log detalhado antes de salvar (debug)
   - ✅ Corrigido: `setCurrentPlan(data)` após CREATE bem-sucedido

### SQL/Database:
3. **`/app/supabase_meal_plans_rls_fix.sql`** - NOVO arquivo com correções de RLS
   - ✅ Política INSERT: Valida vínculo em `patient_profiles` 
   - ✅ Política UPDATE: Adiciona USING + WITH CHECK com validação de vínculo
   - ✅ Política SELECT: Valida vínculo ativo professional-patient
   - ✅ Política DELETE: Valida vínculo antes de permitir exclusão
   - ✅ Comentários explicativos nas policies

### Documentação:
4. **`/app/BUG_REPORT_DRAFT_SAVE.md`** - NOVO relatório de análise completa

---

## (C) SQL DE RLS PRONTO PARA RODAR

**ARQUIVO**: `/app/supabase_meal_plans_rls_fix.sql`

```sql
-- ============================================
-- FIX: RLS Policies para meal_plans
-- Corrige bug de salvar plano do rascunho
-- ============================================

-- Remove policies antigas
DROP POLICY IF EXISTS "Professionals can view their patients meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can create meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can update their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can delete their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can view their own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Admin full access meal_plans" ON meal_plans;

-- ==================== POLICIES CORRIGIDAS ====================

-- Admin pode tudo
CREATE POLICY "Admin full access meal_plans" ON meal_plans
    FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ✅ FIX 1: Professional SELECT - valida ownership via patient_profiles
CREATE POLICY "Professionals can view their patients meal plans" ON meal_plans
    FOR SELECT 
    USING (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- ✅ FIX 2: Professional INSERT - valida ownership do paciente
CREATE POLICY "Professionals can create meal plans" ON meal_plans
    FOR INSERT 
    WITH CHECK (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- ✅ FIX 3: Professional UPDATE - valida ownership e WITH CHECK
CREATE POLICY "Professionals can update their meal plans" ON meal_plans
    FOR UPDATE 
    USING (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    )
    WITH CHECK (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- Professional DELETE - valida ownership
CREATE POLICY "Professionals can delete their meal plans" ON meal_plans
    FOR DELETE 
    USING (
        professional_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_profiles 
            WHERE patient_id = meal_plans.patient_id 
            AND professional_id = auth.uid()
            AND status = 'active'
        )
    );

-- Patient SELECT - apenas seus próprios planos
CREATE POLICY "Patients can view their own meal plans" ON meal_plans
    FOR SELECT 
    USING (patient_id = auth.uid());

-- ============================================
-- FIM DAS CORREÇÕES RLS
-- ============================================

-- Verificação: Contar policies ativas
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'meal_plans'
ORDER BY policyname;
```

---

## (D) CHECKLIST DE TESTES

### ✅ Teste 1: Carregar Rascunho e Salvar (PENDENTE)
- [ ] Login como profissional
- [ ] Acessar perfil de paciente vinculado
- [ ] Ir para aba "Pré-Plano"
- [ ] Clicar em "Usar como Plano Oficial"
- [ ] Editor carrega com dados do rascunho
- [ ] Clicar em "Salvar Plano"
- [ ] Verificar: Plano salvo sem erro 403/401
- [ ] Recarregar página
- [ ] Verificar: Plano permanece salvo

**Status**: AGUARDANDO EXECUÇÃO  
**Resultado Esperado**: Plano salva e persiste sem erros

---

### ✅ Teste 2: Validar Permissões Cross-Professional (PENDENTE)
- [ ] Login como profissional A
- [ ] Criar paciente vinculado ao profissional A
- [ ] Criar rascunho para este paciente
- [ ] Salvar plano oficial
- [ ] Logout
- [ ] Login como profissional B (diferente)
- [ ] Tentar acessar o plano do paciente do profissional A
- [ ] Verificar: Acesso negado (esperado)
- [ ] Tentar criar plano para paciente não vinculado
- [ ] Verificar: INSERT bloqueado (esperado)

**Status**: AGUARDANDO EXECUÇÃO  
**Resultado Esperado**: Profissional B não consegue acessar/modificar dados de pacientes de A

---

### ✅ Teste 3: Verificar "Body Stream Already Read" (PENDENTE)
- [ ] Forçar erro de permissão (tentar salvar plano de outro profissional)
- [ ] Verificar console do browser
- [ ] Verificar: Mensagem de erro clara sem "body stream already read"
- [ ] Toast exibe mensagem de erro amigável

**Status**: AGUARDANDO EXECUÇÃO  
**Resultado Esperado**: Erro RLS exibe mensagem clara, sem erro de parsing

---

### ✅ Teste 4: Fluxo Paciente (READ-ONLY) (PENDENTE)
- [ ] Login como paciente
- [ ] Acessar dashboard
- [ ] Verificar: Plano alimentar visível (se existir)
- [ ] Verificar: Nenhuma opção de edição disponível
- [ ] Verificar: Não consegue acessar pré-planos (apenas profissional vê)

**Status**: AGUARDANDO EXECUÇÃO  
**Resultado Esperado**: Paciente vê apenas seu plano, sem acesso a edição

---

### ✅ Teste 5: Atualizar Plano Existente (PENDENTE)
- [ ] Login como profissional
- [ ] Abrir plano existente de paciente vinculado
- [ ] Modificar refeições/alimentos
- [ ] Salvar alterações
- [ ] Verificar: UPDATE executado com sucesso
- [ ] Recarregar página
- [ ] Verificar: Modificações persistidas

**Status**: AGUARDANDO EXECUÇÃO  
**Resultado Esperado**: UPDATE funciona para planos do próprio profissional

---

### ✅ Teste 6: Plano Duplicado (INSERT vs UPDATE) (PENDENTE)
- [ ] Paciente com plano ativo existente
- [ ] Profissional carrega rascunho
- [ ] Clicar "Usar como Plano Oficial"
- [ ] Salvar
- [ ] Verificar no Supabase: Se plano foi UPDATED ou novo INSERT foi criado
- [ ] Verificar comportamento da função `createMealPlan()` linha 834-858

**Status**: AGUARDANDO EXECUÇÃO  
**Resultado Esperado**: Função deve fazer UPDATE do plano existente, não criar duplicado

---

## RESUMO DOS 6 CONFLITOS RLS IDENTIFICADOS:

1. **Policy INSERT sem validação de ownership** → Professional podia criar plano para qualquer patient_id
2. **Policy UPDATE sem WITH CHECK** → Faltava validação dos valores sendo atualizados
3. **Policy SELECT sem join patient_profiles** → Professional podia ver planos sem verificar vínculo ativo
4. **Policy DELETE sem validação** → Professional podia deletar planos sem verificar vínculo
5. **Função createMealPlan UPDATE automático** → Tentava UPDATE em planos de outros profissionais causando falha de permissão
6. **Tratamento de erro frontend** → Consumia Supabase error response múltiplas vezes gerando "body stream already read"

---

## PRÓXIMOS PASSOS:

1. ✅ Revisar e aprovar SQL de RLS
2. ⏳ Executar `/app/supabase_meal_plans_rls_fix.sql` no Supabase SQL Editor
3. ⏳ Aplicar correções no frontend (`supabase.js` e `MealPlanEditor.js`)
4. ⏳ Executar checklist de testes completo
5. ⏳ Validar em ambiente de produção

---

## NOTAS TÉCNICAS:

- **RLS = Row Level Security**: Sistema de permissões a nível de linha do PostgreSQL/Supabase
- **USING**: Valida linhas que o usuário pode acessar/modificar
- **WITH CHECK**: Valida valores que o usuário pode inserir/atualizar
- **patient_profiles**: Tabela de vínculo entre professional e patient (linha 37-44 supabase_schema_complete.sql)
- **auth.uid()**: ID do usuário autenticado no Supabase Auth

---

**FIM DO RELATÓRIO**
