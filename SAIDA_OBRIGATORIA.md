# 🎯 SAÍDA OBRIGATÓRIA - FIX BUG DRAFT MEAL PLAN

---

## (A) CAUSA RAIZ RESUMIDA (5 LINHAS)

1. **Policies RLS de `meal_plans` não validavam ownership do paciente** - Professional podia criar/editar planos sem verificar vínculo ativo em `patient_profiles`
2. **Policy UPDATE tinha apenas USING sem WITH CHECK** - Não validava valores sendo modificados, permitindo updates não autorizados
3. **Função `createMealPlan()` fazia UPDATE automático de planos existentes** - Ao detectar plano ativo, tentava UPDATE que falhava com erro RLS se o plano pertencia a outro professional
4. **Frontend consumia Supabase error response múltiplas vezes** - `throw new Error(error.message)` causava "body stream already read" ao tentar acessar error.message depois de já ter sido consumido
5. **Ausência de validação de vínculo professional-patient** - Nenhuma policy verificava se `patient_id` tinha status='active' na tabela `patient_profiles` ao salvar/atualizar plano

---

## (B) ARQUIVOS ALTERADOS

### ✅ FRONTEND (2 arquivos modificados)

#### 1. `/app/frontend/src/lib/supabase.js`

**Linhas modificadas**: 831-948

**Função `createMealPlan()`** (linhas 831-918):
- ✅ Adicionado tratamento de `selectError` ao verificar plano existente
- ✅ Tratamento correto de `error` em UPDATE sem consumir response múltiplas vezes
- ✅ Tratamento correto de `error` em INSERT com mensagens detalhadas
- ✅ Adicionado `hint` nas mensagens para guiar usuário sobre permissões
- ✅ Return estruturado sempre: `{ data, error }` com error detalhado ou null

**Função `updateMealPlan()`** (linhas 920-948):
- ✅ Tratamento de erro sem consumir response
- ✅ Mensagens com `message`, `code`, `details`, `hint`
- ✅ Return com `error: null` em caso de sucesso

#### 2. `/app/frontend/src/pages/MealPlanEditor.js`

**Linhas modificadas**: 699-794

**Função `handleSavePlan()`**:
- ✅ **REMOVIDO**: `throw new Error(error.message)` que causava "body stream already read"
- ✅ **ADICIONADO**: Verificação de `error.code === '42501'` (RLS permission denied do PostgreSQL)
- ✅ **ADICIONADO**: Mensagens específicas para erro de permissão com orientação ao usuário
- ✅ **ADICIONADO**: `setCurrentPlan(data)` após CREATE bem-sucedido (estava faltando)
- ✅ **ADICIONADO**: Log detalhado antes de salvar com patient_id, professional_id, currentPlan (debug)
- ✅ **CORRIGIDO**: Return antecipado em caso de erro, ao invés de throw (evita consumir response múltiplas vezes)

### ✅ SQL/DATABASE (1 arquivo NOVO)

#### 3. `/app/supabase_meal_plans_rls_fix.sql`

**Arquivo NOVO** - 183 linhas - SQL de correção RLS

**Conteúdo**:
- DROP de 6 policies antigas com conflitos de permissão
- CREATE de 6 policies corrigidas:
  
  **1. Admin full access meal_plans** (FOR ALL):
  - Mantém acesso total para role='admin'
  
  **2. Professionals can view their patients meal plans** (FOR SELECT):
  - Valida: `professional_id = auth.uid()` AND vínculo ativo em `patient_profiles`
  
  **3. Professionals can create meal plans** (FOR INSERT WITH CHECK):
  - Valida: `professional_id = auth.uid()` AND vínculo ativo em `patient_profiles`
  - **FIX PRINCIPAL**: Antes não verificava se patient_id estava vinculado
  
  **4. Professionals can update their meal plans** (FOR UPDATE USING + WITH CHECK):
  - **USING**: Valida linha existente + vínculo ativo
  - **WITH CHECK**: Valida valores sendo atualizados + vínculo ativo
  - **FIX PRINCIPAL**: Antes tinha apenas USING sem WITH CHECK
  
  **5. Professionals can delete their meal plans** (FOR DELETE):
  - Valida: `professional_id = auth.uid()` AND vínculo ativo em `patient_profiles`
  
  **6. Patients can view their own meal plans** (FOR SELECT):
  - Mantém: `patient_id = auth.uid()` (read-only para pacientes)

- **COMMENTS** explicativos em cada policy
- **Query de verificação** ao final para listar policies criadas

### ✅ DOCUMENTAÇÃO (2 arquivos NOVOS)

#### 4. `/app/BUG_REPORT_DRAFT_SAVE.md`
Relatório de análise completa com causa raiz, arquivos alterados, SQL e checklist de testes

#### 5. `/app/IMPLEMENTACAO_COMPLETA.md`
Documentação técnica detalhada com explicação de cada conflito RLS, antes/depois e referências

---

## (C) SQL DE RLS PRONTO PARA RODAR

**INSTRUÇÕES**:
1. Acesse: Supabase Dashboard → SQL Editor
2. Cole o conteúdo completo do arquivo `/app/supabase_meal_plans_rls_fix.sql`
3. Execute o script (deve retornar "Success" e criar 6 policies)
4. Execute a query de verificação no final (comentada) para confirmar policies

**ARQUIVO**: `/app/supabase_meal_plans_rls_fix.sql`

```sql
-- ============================================
-- FIX: RLS Policies para meal_plans
-- Corrige bug de salvar plano do rascunho
-- Data: 2025
-- Branch: main-feature-FIX2
-- ============================================

BEGIN;

-- Remove policies antigas que têm conflitos
DROP POLICY IF EXISTS "Professionals can view their patients meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can create meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can update their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Professionals can delete their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can view their own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Admin full access meal_plans" ON meal_plans;

-- ==================== NOVA ESTRUTURA DE POLICIES ====================

-- 1. Admin pode tudo (mantém acesso total)
CREATE POLICY "Admin full access meal_plans" ON meal_plans
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. ✅ FIX: Professional SELECT com validação de vínculo
-- Professional só pode ver planos de pacientes que estão vinculados a ele
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

-- 3. ✅ FIX: Professional INSERT com validação de vínculo
-- Professional só pode criar planos para pacientes vinculados a ele
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

-- 4. ✅ FIX: Professional UPDATE com USING + WITH CHECK
-- Professional só pode atualizar planos de pacientes vinculados
-- USING: valida linha existente
-- WITH CHECK: valida valores sendo atualizados
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

-- 5. Professional DELETE com validação de vínculo
-- Professional só pode deletar planos de pacientes vinculados
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

-- 6. Patient SELECT (sem mudanças - já estava correto)
-- Paciente só pode ver seus próprios planos
CREATE POLICY "Patients can view their own meal plans" ON meal_plans
    FOR SELECT 
    USING (patient_id = auth.uid());

COMMIT;

-- ============================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================

COMMENT ON POLICY "Professionals can view their patients meal plans" ON meal_plans IS 
'Professional pode ver apenas planos de pacientes com vínculo ativo em patient_profiles';

COMMENT ON POLICY "Professionals can create meal plans" ON meal_plans IS 
'Professional pode criar planos apenas para pacientes vinculados (valida via patient_profiles.status=active)';

COMMENT ON POLICY "Professionals can update their meal plans" ON meal_plans IS 
'Professional pode atualizar apenas planos de pacientes vinculados. USING valida linha existente, WITH CHECK valida valores atualizados';

COMMENT ON POLICY "Professionals can delete their meal plans" ON meal_plans IS 
'Professional pode deletar apenas planos de pacientes vinculados';

-- ============================================
-- VERIFICAÇÃO: Listar policies criadas
-- Execute separadamente:
-- ============================================
-- SELECT 
--     schemaname, 
--     tablename, 
--     policyname, 
--     cmd
-- FROM pg_policies 
-- WHERE tablename = 'meal_plans'
-- ORDER BY policyname;
--
-- Deve retornar 6 policies (1 admin, 4 professional, 1 patient)
-- ============================================
```

**ATENÇÃO**: Após executar o SQL, o sistema já estará corrigido no backend. As correções do frontend já foram aplicadas nos arquivos `.js`.

---

## (D) CHECKLIST DE TESTES E RESULTADOS

### ✅ Teste 1: Carregar Rascunho e Salvar (PRINCIPAL)

**Objetivo**: Validar que o bug foi corrigido

**Passos**:
1. [ ] Login como profissional (credenciais válidas)
2. [ ] Acessar perfil de paciente que está vinculado (via aba "Pacientes")
3. [ ] Navegar para aba "Pré-Plano"
4. [ ] Verificar pré-plano gerado pela anamnese
5. [ ] Clicar botão "Usar como Plano Oficial"
6. [ ] Sistema redireciona para MealPlanEditor
7. [ ] Verificar refeições carregadas do pré-plano
8. [ ] Modificar alguma refeição (opcional)
9. [ ] Clicar em "Salvar Plano"
10. [ ] Observar console do browser (F12)
11. [ ] Verificar toast de sucesso
12. [ ] Recarregar página (F5)
13. [ ] Verificar plano permanece salvo

**Resultado Esperado**:
- ✅ Nenhum erro 403/401/42501 no console
- ✅ Nenhum erro "body stream already read"
- ✅ Toast verde: "Plano criado com sucesso!" (se novo) ou "Plano atualizado com sucesso!" (se existente)
- ✅ Plano persiste no banco após reload
- ✅ Paciente consegue visualizar o plano em seu dashboard

**Status**: ⏳ AGUARDANDO EXECUÇÃO

---

### ✅ Teste 2: Validar Erro de Permissão (Cross-Professional)

**Objetivo**: Garantir que professional A não consegue criar plano para paciente de professional B

**Passos**:
1. [ ] Login como profissional A
2. [ ] Criar paciente1 vinculado ao profissional A
3. [ ] Criar pré-plano para paciente1
4. [ ] Logout
5. [ ] Login como profissional B (diferente)
6. [ ] Tentar acessar MealPlanEditor passando patient_id do paciente1 na URL
7. [ ] Tentar salvar plano
8. [ ] Observar console e toast

**Resultado Esperado**:
- ❌ ProfB não vê paciente1 na lista de "Pacientes"
- ❌ Se forçar URL, ao salvar retorna erro
- ✅ Console: "Erro ao criar plano:" com code 42501 ou mensagem de permissão
- ✅ Toast vermelho: "Sem permissão: Verifique se o paciente está vinculado a você..."
- ❌ Plano NÃO é criado no banco

**Status**: ⏳ AGUARDANDO EXECUÇÃO

---

### ✅ Teste 3: Verificar "Body Stream Already Read" Eliminado

**Objetivo**: Confirmar que o erro de parsing foi eliminado

**Passos**:
1. [ ] Criar cenário de erro forçado (ex: remover vínculo em patient_profiles via SQL)
2. [ ] Login como professional
3. [ ] Tentar salvar plano para paciente sem vínculo
4. [ ] Abrir DevTools → Console
5. [ ] Verificar mensagem de erro exibida

**Resultado Esperado**:
- ❌ NÃO deve aparecer "Failed to execute json on Response: body stream already read"
- ✅ Console mostra erro estruturado: `{ message, code, details, hint }`
- ✅ Toast: Mensagem amigável sobre permissão
- ✅ Erro pode ser entendido e debugado

**Status**: ⏳ AGUARDANDO EXECUÇÃO

---

### ✅ Teste 4: Patient View (Read-Only)

**Objetivo**: Garantir que paciente não tem acesso a edição

**Passos**:
1. [ ] Login como paciente
2. [ ] Acessar Dashboard
3. [ ] Verificar se plano alimentar aparece
4. [ ] Verificar menu lateral
5. [ ] Tentar acessar "Pré-Plano" (não deve existir para pacientes)
6. [ ] Verificar botões de edição (não devem existir)

**Resultado Esperado**:
- ✅ Paciente vê seu plano alimentar (se existir)
- ❌ Paciente NÃO vê aba "Pré-Plano"
- ❌ Paciente NÃO vê botões "Editar", "Salvar", "Adicionar"
- ✅ Menu lateral: apenas "Meu Plano" (read-only), não "Editor"

**Status**: ⏳ AGUARDANDO EXECUÇÃO

---

### ✅ Teste 5: Update de Plano Existente

**Objetivo**: Validar que UPDATE funciona com policies novas

**Passos**:
1. [ ] Paciente já tem plano ativo criado
2. [ ] Login como professional (dono do plano)
3. [ ] Acessar perfil do paciente
4. [ ] Navegar para aba "Plano" ou "Editor"
5. [ ] Modificar refeições (adicionar/remover alimentos)
6. [ ] Clicar "Salvar Plano"
7. [ ] Verificar console
8. [ ] Recarregar página

**Resultado Esperado**:
- ✅ UPDATE executado com sucesso
- ✅ Console: "Salvando plano:" com log mostrando `currentPlan.id`
- ✅ Toast: "Plano atualizado com sucesso!"
- ✅ Modificações persistidas após F5
- ✅ `updated_at` modificado no banco

**Status**: ⏳ AGUARDANDO EXECUÇÃO

---

### ✅ Teste 6: Plano Duplicado (Comportamento de createMealPlan)

**Objetivo**: Verificar lógica quando paciente já tem plano ativo

**Passos**:
1. [ ] Paciente já tem plano ativo (`is_active=true`)
2. [ ] Professional carrega pré-plano do mesmo paciente
3. [ ] Clicar "Usar como Plano Oficial"
4. [ ] Salvar
5. [ ] Abrir Supabase Dashboard → Table Editor → meal_plans
6. [ ] Filtrar por `patient_id` do paciente
7. [ ] Contar quantos registros existem
8. [ ] Verificar `updated_at` do plano existente

**Resultado Esperado**:
- ✅ Apenas 1 registro com `is_active=true` para este `patient_id`
- ✅ Registro foi **UPDATED**, não criado novo (INSERT)
- ✅ `updated_at` foi modificado para timestamp recente
- ✅ `plan_data` reflete os dados do pré-plano

**Status**: ⏳ AGUARDANDO EXECUÇÃO

**Observação**: A função `createMealPlan()` verifica se já existe plano ativo. Se existir, faz UPDATE ao invés de INSERT. Isso evita planos duplicados.

---

## 📊 RESUMO DOS 6 CONFLITOS RLS RESOLVIDOS

| # | Conflito | Tabela | Policy | Solução |
|---|----------|--------|--------|---------|
| 1 | INSERT sem validação ownership | meal_plans | INSERT WITH CHECK | ✅ Adicionado EXISTS na patient_profiles |
| 2 | UPDATE sem WITH CHECK | meal_plans | UPDATE | ✅ Adicionado USING + WITH CHECK |
| 3 | SELECT sem validação vínculo | meal_plans | SELECT | ✅ Adicionado EXISTS na patient_profiles |
| 4 | DELETE sem validação vínculo | meal_plans | DELETE | ✅ Adicionado EXISTS na patient_profiles |
| 5 | createMealPlan UPDATE automático | supabase.js | Função JS | ✅ Tratamento de error explícito |
| 6 | "Body stream already read" | MealPlanEditor.js | Error handling | ✅ Removido throw, adicionado return antecipado |

---

## 🎯 STATUS FINAL

### ✅ CONCLUÍDO:
- [x] Análise de causa raiz
- [x] Identificação de 6 conflitos RLS
- [x] Correção de policies SQL (arquivo criado)
- [x] Correção frontend supabase.js (aplicada)
- [x] Correção frontend MealPlanEditor.js (aplicada)
- [x] Documentação completa (3 arquivos .md)
- [x] Checklist de testes preparado

### ⏳ PENDENTE (REQUER AÇÃO DO USUÁRIO):
- [ ] **CRÍTICO**: Aplicar SQL no Supabase (`/app/supabase_meal_plans_rls_fix.sql`)
- [ ] Executar Teste 1: Carregar Rascunho e Salvar
- [ ] Executar Testes 2-6 para validação completa
- [ ] Validar em ambiente de produção
- [ ] Monitorar logs por 24h após deploy

---

## 📋 PRÓXIMA AÇÃO IMEDIATA

**VOCÊ DEVE FAZER AGORA**:

1. **Abrir Supabase Dashboard**
   - Ir em: `SQL Editor`
   - Criar nova query

2. **Copiar conteúdo de**: `/app/supabase_meal_plans_rls_fix.sql`
   - Você pode visualizar o arquivo completo acima na seção (C)

3. **Executar SQL**
   - Colar no editor
   - Clicar em "Run"
   - Aguardar "Success"

4. **Verificar policies criadas**
   - Executar query de verificação (está comentada no final do SQL)
   - Deve retornar 6 policies

5. **Testar fluxo completo**
   - Seguir Teste 1 do checklist
   - Carregar rascunho → Salvar → Verificar persistência

---

**FIM DA SAÍDA OBRIGATÓRIA**

✅ Correções aplicadas no código  
⏳ SQL aguardando execução no Supabase  
⏳ Testes aguardando validação  

**Todos os arquivos estão prontos em `/app/`**
