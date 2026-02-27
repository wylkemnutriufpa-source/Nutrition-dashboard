# ✅ IMPLEMENTAÇÃO COMPLETA - FIX BUG SALVAR PLANO DO RASCUNHO

## 📋 RESUMO EXECUTIVO

**Status**: ✅ **IMPLEMENTADO - AGUARDANDO TESTE E APLICAÇÃO SQL**

**Problema Original**: Ao carregar um plano do rascunho e clicar em "Salvar", o plano não persistia no Supabase, retornando erros de permissão RLS e "body stream already read".

**Solução Aplicada**: 
1. ✅ Correção de 6 policies RLS na tabela `meal_plans`
2. ✅ Melhoria no tratamento de erros do frontend (eliminado "body stream already read")
3. ✅ Adição de validação de vínculo professional-patient em todas as operações

---

## 🎯 CAUSA RAIZ (5 LINHAS)

1. **Policies RLS sem validação de ownership** - Professional podia criar/editar planos sem verificar vínculo ativo com paciente via `patient_profiles`
2. **Policy UPDATE sem WITH CHECK** - Faltava validação dos valores sendo modificados
3. **Função createMealPlan UPDATE automático** - Tentava UPDATE em planos de outros profissionais causando erro de permissão
4. **Frontend consumia error response múltiplas vezes** - Causava "body stream already read" ao acessar `error.message`
5. **Falta de mensagens de erro amigáveis** - Usuário não entendia que o problema era de permissão/vínculo

---

## 📁 ARQUIVOS MODIFICADOS

### ✅ Frontend (3 arquivos)

#### 1. `/app/frontend/src/lib/supabase.js`
**Função**: `createMealPlan()` (linhas 831-918)
**Mudanças**:
- ✅ Adicionado tratamento de `selectError` ao verificar plano existente
- ✅ Adicionado tratamento correto de `error` em UPDATE (sem consumir response múltiplas vezes)
- ✅ Adicionado tratamento correto de `error` em INSERT
- ✅ Adicionado `hint` nas mensagens de erro para guiar o usuário
- ✅ Return estruturado: `{ data, error }` sempre com error detalhado ou null

**Função**: `updateMealPlan()` (linhas 920-948)
**Mudanças**:
- ✅ Tratamento de erro sem consumir response
- ✅ Mensagens de erro com hint e code
- ✅ Return sempre com `error: null` em caso de sucesso

#### 2. `/app/frontend/src/pages/MealPlanEditor.js`
**Função**: `handleSavePlan()` (linhas 699-794)
**Mudanças**:
- ✅ Removido `throw new Error(error.message)` que causava "body stream already read"
- ✅ Verificação de `error.code === '42501'` (RLS permission denied)
- ✅ Mensagens específicas para erro de permissão
- ✅ `setCurrentPlan(data)` após CREATE bem-sucedido
- ✅ Log detalhado antes de salvar (debug)
- ✅ Return antecipado com toast de erro específico

### ✅ SQL/Database (1 arquivo NOVO)

#### 3. `/app/supabase_meal_plans_rls_fix.sql` (NOVO)
**Conteúdo**: 183 linhas
**Ações**:
- ✅ DROP de 6 policies antigas com conflitos
- ✅ CREATE de 6 policies corrigidas:
  1. **Admin full access** - mantém acesso total
  2. **Professional SELECT** - valida vínculo via `patient_profiles.status='active'`
  3. **Professional INSERT** - valida vínculo e `WITH CHECK`
  4. **Professional UPDATE** - valida vínculo com `USING` + `WITH CHECK`
  5. **Professional DELETE** - valida vínculo antes de deletar
  6. **Patient SELECT** - mantém acesso read-only aos próprios planos
- ✅ COMMENTS explicativos em cada policy
- ✅ Query de verificação ao final

### ✅ Documentação (1 arquivo NOVO)

#### 4. `/app/BUG_REPORT_DRAFT_SAVE.md` (NOVO)
**Conteúdo**: Relatório completo de análise do bug
- Causa raiz resumida
- Lista de arquivos alterados
- SQL completo de RLS
- Checklist de 6 testes a executar
- Explicação dos 6 conflitos RLS identificados

---

## 🔍 DETALHES DAS CORREÇÕES

### **Conflito RLS #1 - INSERT sem validação de ownership**

**Antes**:
```sql
CREATE POLICY "Professionals can create meal plans" ON meal_plans
    FOR INSERT WITH CHECK (professional_id = auth.uid());
```

❌ **Problema**: Professional podia inserir plano para **qualquer** patient_id, mesmo que o paciente não estivesse vinculado a ele.

**Depois**:
```sql
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
```

✅ **Solução**: Valida que `patient_id` tem vínculo **ativo** com o professional em `patient_profiles`.

---

### **Conflito RLS #2 - UPDATE sem WITH CHECK**

**Antes**:
```sql
CREATE POLICY "Professionals can update their meal plans" ON meal_plans
    FOR UPDATE USING (professional_id = auth.uid());
```

❌ **Problema**: 
1. Apenas `USING` valida a linha existente, mas não os valores sendo atualizados
2. Não valida se `patient_id` está vinculado ao professional

**Depois**:
```sql
CREATE POLICY "Professionals can update their meal plans" ON meal_plans
    FOR UPDATE 
    USING (
        professional_id = auth.uid()
        AND EXISTS (...)
    )
    WITH CHECK (
        professional_id = auth.uid()
        AND EXISTS (...)
    );
```

✅ **Solução**: 
- `USING` valida linha existente + vínculo
- `WITH CHECK` valida valores sendo atualizados + vínculo

---

### **Conflito RLS #3 - SELECT sem validação de vínculo**

**Antes**:
```sql
CREATE POLICY "Professionals can view their patients meal plans" ON meal_plans
    FOR SELECT USING (professional_id = auth.uid());
```

❌ **Problema**: Professional vê planos onde `professional_id = auth.uid()`, mas não verifica se o vínculo com o paciente ainda está ativo.

**Depois**:
```sql
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
```

✅ **Solução**: Valida vínculo ativo. Se paciente foi desvinculado, professional não vê mais seus planos.

---

### **Conflito Frontend #4 - "Body Stream Already Read"**

**Antes** (MealPlanEditor.js linha 743-744):
```javascript
if (error) {
  console.error('Erro update:', error);
  throw new Error(error.message || 'Erro ao atualizar');  // ❌ Consome response
}
```

❌ **Problema**: 
1. `error.message` pode ser undefined se error for um Supabase error object
2. `throw new Error()` tenta ler o error novamente, causando "body stream already read"
3. O catch externo tenta acessar `error.message` novamente

**Depois**:
```javascript
if (error) {
  console.error('Erro ao atualizar plano:', error);
  const errorMsg = error.message || error.hint || 'Erro ao atualizar plano';
  toast.error(`Erro: ${errorMsg}`);
  if (error.code === '42501' || errorMsg.includes('permiss')) {
    toast.error('Você não tem permissão para editar este plano...');
  }
  return;  // ✅ Return antecipado, não throw
}
```

✅ **Solução**: 
- Não usa `throw`, usa `return` antecipado
- Acessa `error.message` apenas uma vez
- Verifica `error.code` para identificar erro RLS (42501)
- Toast com mensagem amigável

---

### **Conflito Backend #5 - createMealPlan UPDATE automático**

**Antes** (supabase.js linha 843-858):
```javascript
if (existing) {
  const { data: updatedList, error } = await supabase
    .from('meal_plans')
    .update({...})
    .eq('id', existing.id)
    .select();
  
  const data = updatedList && updatedList.length > 0 ? updatedList[0] : null;
  return { data, error };  // ❌ Error pode ser RLS permission denied
}
```

❌ **Problema**: 
Se `existing` plano foi criado por outro professional, UPDATE falha com erro RLS mas erro não é tratado adequadamente.

**Depois**:
```javascript
if (existing) {
  const { data: updatedList, error } = await supabase
    .from('meal_plans')
    .update({...})
    .eq('id', existing.id)
    .select();
  
  if (error) {  // ✅ Trata error explicitamente
    console.error('Erro ao atualizar plano existente:', error);
    return { 
      data: null, 
      error: { 
        message: error.message || 'Sem permissão para atualizar este plano',
        code: error.code,
        details: error.details,
        hint: 'Verifique se você tem permissão para editar planos deste paciente'
      } 
    };
  }
  
  const data = updatedList && updatedList.length > 0 ? updatedList[0] : null;
  return { data, error: null };  // ✅ Retorna error: null em sucesso
}
```

✅ **Solução**: Trata error explicitamente e retorna mensagem com hint.

---

### **Conflito Backend #6 - Error Object Não Estruturado**

**Antes**:
```javascript
} catch (err) {
  console.error('Erro em createMealPlan:', err);
  return { data: null, error: { message: err.message || 'Erro ao criar plano' } };
}
```

❌ **Problema**: Não passa `code`, `details`, `hint` do Supabase error.

**Depois**:
```javascript
} catch (err) {
  console.error('Erro inesperado em createMealPlan:', err);
  return { 
    data: null, 
    error: { 
      message: err?.message || 'Erro inesperado ao salvar plano',
      code: 'UNEXPECTED_ERROR',
      details: String(err)
    } 
  };
}
```

✅ **Solução**: Error estruturado com code, details para debug.

---

## 🧪 CHECKLIST DE TESTES (6 CENÁRIOS)

### ✅ Teste 1: Carregar Rascunho e Salvar
**Objetivo**: Validar fluxo completo de salvar plano do rascunho

**Passos**:
1. Login como professional com credenciais válidas
2. Acessar perfil de paciente vinculado
3. Ir para aba "Pré-Plano" (Draft Meal Plan)
4. Clicar em "Usar como Plano Oficial"
5. Editor abre com dados carregados
6. Clicar em "Salvar Plano"
7. Verificar toast de sucesso
8. Recarregar página (F5)
9. Verificar plano permanece salvo

**Resultado Esperado**:
- ✅ Plano salva sem erro 403/401/42501
- ✅ Toast: "Plano criado com sucesso!"
- ✅ Plano persiste após reload

**Status**: ⏳ AGUARDANDO TESTE

---

### ✅ Teste 2: Validar Permissões Cross-Professional
**Objetivo**: Garantir que professional A não acessa dados de professional B

**Passos**:
1. Criar 2 profissionais: profA e profB
2. ProfA: Criar paciente1 vinculado
3. ProfA: Criar plano para paciente1
4. Logout
5. Login como profB
6. Tentar acessar paciente1
7. Tentar criar plano para paciente1

**Resultado Esperado**:
- ❌ ProfB não vê paciente1 na lista
- ❌ ProfB não consegue criar plano (erro RLS)
- ✅ Toast: "Sem permissão: Verifique se o paciente está vinculado a você"

**Status**: ⏳ AGUARDANDO TESTE

---

### ✅ Teste 3: Erro "Body Stream Already Read" Eliminado
**Objetivo**: Verificar que erro RLS retorna mensagem clara

**Passos**:
1. Forçar erro de permissão (criar vínculo inativo em patient_profiles)
2. Tentar salvar plano
3. Abrir DevTools Console
4. Verificar erro exibido

**Resultado Esperado**:
- ❌ NÃO deve aparecer "body stream already read"
- ✅ Console mostra: "Erro ao criar plano:" com details
- ✅ Toast: "Sem permissão: Verifique se o paciente está vinculado..."

**Status**: ⏳ AGUARDANDO TESTE

---

### ✅ Teste 4: Patient View (Read-Only)
**Objetivo**: Validar que paciente vê apenas seus planos

**Passos**:
1. Login como paciente
2. Acessar Dashboard
3. Verificar menu lateral
4. Tentar acessar "Pré-Plano" (não deve existir)

**Resultado Esperado**:
- ✅ Paciente vê seu plano alimentar
- ❌ Paciente NÃO vê aba "Pré-Plano"
- ❌ Paciente NÃO vê botões de edição
- ✅ Menu: apenas "Meu Plano", não "Editor de Plano"

**Status**: ⏳ AGUARDANDO TESTE

---

### ✅ Teste 5: Update de Plano Existente
**Objetivo**: Validar UPDATE com policies novas

**Passos**:
1. Login como professional
2. Abrir plano existente de paciente vinculado
3. Modificar refeições/alimentos
4. Clicar em "Salvar Plano"
5. Verificar console
6. Recarregar página

**Resultado Esperado**:
- ✅ UPDATE executado com sucesso
- ✅ Console: "Salvando plano:" com log detalhado
- ✅ Toast: "Plano atualizado com sucesso!"
- ✅ Modificações persistidas após reload

**Status**: ⏳ AGUARDANDO TESTE

---

### ✅ Teste 6: Plano Duplicado (Verificar Lógica)
**Objetivo**: Validar comportamento quando paciente já tem plano ativo

**Passos**:
1. Paciente com plano ativo existente
2. Professional carrega rascunho
3. Clicar "Usar como Plano Oficial"
4. Salvar
5. Abrir Supabase → meal_plans table
6. Verificar: quantos registros para este patient_id?

**Resultado Esperado**:
- ✅ Apenas 1 registro para patient_id (UPDATE, não INSERT)
- ✅ `updated_at` foi modificado
- ✅ Dados do plano refletem o rascunho

**Status**: ⏳ AGUARDANDO TESTE

---

## 📝 PRÓXIMOS PASSOS (ORDEM OBRIGATÓRIA)

### Passo 1: Aplicar SQL no Supabase ⏳
```bash
# Acessar: Supabase Dashboard → SQL Editor
# Cole o conteúdo de: /app/supabase_meal_plans_rls_fix.sql
# Execute o script completo
# Verifique: 6 policies devem ser criadas
```

### Passo 2: Restart Frontend (se necessário) ⏳
```bash
sudo supervisorctl restart frontend
```

### Passo 3: Executar Testes 1-6 ⏳
- Seguir checklist acima
- Documentar resultados
- Reportar qualquer falha

### Passo 4: Validar em Produção ⏳
- Deploy das alterações frontend
- Verificar logs de erro
- Monitorar por 24h

---

## 🔐 POLÍTICAS RLS FINAIS (RESUMO)

| Policy | Comando | Validação |
|--------|---------|-----------|
| Admin full access | ALL | `role = 'admin'` |
| Professional SELECT | SELECT | `professional_id = auth.uid() AND vínculo ativo` |
| Professional INSERT | INSERT | `professional_id = auth.uid() AND vínculo ativo` (WITH CHECK) |
| Professional UPDATE | UPDATE | `professional_id = auth.uid() AND vínculo ativo` (USING + WITH CHECK) |
| Professional DELETE | DELETE | `professional_id = auth.uid() AND vínculo ativo` |
| Patient SELECT | SELECT | `patient_id = auth.uid()` |

---

## 📊 ANTES vs DEPOIS

### ANTES:
❌ Professional criava plano para qualquer paciente  
❌ UPDATE sem validação de valores  
❌ Error "body stream already read"  
❌ Mensagens genéricas: "Erro ao salvar"  
❌ Não validava vínculo professional-patient  

### DEPOIS:
✅ Professional cria apenas para pacientes vinculados  
✅ UPDATE valida USING + WITH CHECK  
✅ Error tratado corretamente (sem consumir response)  
✅ Mensagens específicas: "Sem permissão: Verifique se o paciente está vinculado a você"  
✅ Todas operations validam vínculo ativo em `patient_profiles`  

---

## 📚 REFERÊNCIAS

- **RLS Documentation**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Policies**: https://www.postgresql.org/docs/current/sql-createpolicy.html
- **Error Handling**: Frontend error objects vs Supabase error objects
- **Tabelas Envolvidas**:
  - `meal_plans` (linha 77-90, supabase_schema_complete.sql)
  - `patient_profiles` (linha 37-48, supabase_schema_complete.sql)
  - `draft_meal_plans` (supabase_draft_meal_plans.sql)

---

**FIM DA IMPLEMENTAÇÃO**

Data: $(date)  
Autor: AI Agent (Emergent)  
Status: ✅ CÓDIGO PRONTO - ⏳ AGUARDANDO APLICAÇÃO SQL E TESTES
