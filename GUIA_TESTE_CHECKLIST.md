# 🧪 Guia de Testes - Checklist Diário MVP

## 📋 Pré-requisitos

### 1. Executar SQL no Supabase
1. Abrir Supabase Dashboard
2. Ir em SQL Editor
3. Copiar todo o conteúdo de `/app/supabase_checklist.sql`
4. Colar e executar
5. Verificar que a tabela `checklist_tasks` foi criada

---

## 🧑‍⚕️ Teste 1: PROFESSIONAL/ADMIN

### **Objetivo:** Criar e gerenciar tarefas para o paciente

### **Passos:**
1. **Login como profissional ou admin**
   - Email: [seu_professional_email]
   - Senha: [sua_senha]

2. **Navegar para perfil do paciente**
   - Ir em "Pacientes"
   - Clicar em qualquer paciente

3. **Ir para aba Checklist**
   - Clicar na aba "Checklist"

4. **Criar primeira tarefa**
   - Digitar no campo: "Beber 2 litros de água"
   - Clicar em "Adicionar"
   - ✅ Tarefa deve aparecer na lista

5. **Criar mais tarefas**
   - "Tomar café da manhã às 8h"
   - "Almoçar às 12h"
   - "Jantar às 19h"
   - ✅ 4 tarefas devem estar na lista

6. **Editar título de uma tarefa**
   - Passar o mouse sobre "Beber 2 litros de água"
   - Clicar no ícone de lápis (✏️)
   - Mudar para "Beber 2,5 litros de água"
   - Clicar no ✓ (check)
   - ✅ Título deve ser atualizado

7. **Cancelar edição**
   - Clicar em editar outra tarefa
   - Começar a editar
   - Clicar no X (cancelar)
   - ✅ Título deve voltar ao original

8. **Excluir tarefa**
   - Passar o mouse sobre uma tarefa
   - Clicar no X vermelho
   - ✅ Tarefa deve desaparecer

9. **Verificar que NÃO pode marcar tarefas**
   - ✅ Círculo de check deve estar desabilitado (não clicável)

---

## 🧑‍🦱 Teste 2: PACIENTE

### **Objetivo:** Visualizar e marcar tarefas como concluídas

### **Passos:**

1. **Logout do profissional**
   - Fazer logout

2. **Login como paciente**
   - Email: [email_do_paciente_que_tem_tarefas]
   - Senha: [senha]

3. **Ver Dashboard**
   - Deve estar automaticamente no Dashboard
   - ✅ Deve ver card "Checklist Diário"

4. **Ver tarefas criadas pelo profissional**
   - ✅ Deve ver as 3 tarefas restantes
   - ✅ Barra de progresso deve mostrar 0%
   - ✅ Contador deve mostrar "0/3"

5. **Marcar primeira tarefa como concluída**
   - Clicar no círculo da tarefa "Beber 2,5 litros de água"
   - ✅ Deve aparecer check verde ✓
   - ✅ Texto deve ficar cinza e riscado
   - ✅ Barra de progresso: 33%
   - ✅ Contador: 1/3

6. **Marcar segunda tarefa**
   - Clicar em outra tarefa
   - ✅ Barra de progresso: 67%
   - ✅ Contador: 2/3

7. **Marcar terceira tarefa**
   - Clicar na última tarefa
   - ✅ Barra de progresso: 100%
   - ✅ Contador: 3/3
   - ✅ Barra verde completa

8. **Desmarcar uma tarefa**
   - Clicar novamente em tarefa concluída
   - ✅ Check verde some
   - ✅ Texto volta ao normal
   - ✅ Barra de progresso: 67%
   - ✅ Contador: 2/3

9. **Recarregar página**
   - Pressionar F5 ou Cmd+R
   - ✅ Estado das tarefas deve persistir (2 marcadas, 1 desmarcada)

10. **Verificar que NÃO pode criar/editar/excluir**
    - ✅ Não deve ter campo "Nova tarefa"
    - ✅ Não deve ter ícone de lápis ao hover
    - ✅ Não deve ter ícone de X vermelho

---

## 🔄 Teste 3: ADERÊNCIA NO PERFIL

### **Objetivo:** Verificar cálculo de aderência

### **Passos:**

1. **Voltar para profissional/admin**
   - Logout do paciente
   - Login como profissional

2. **Abrir perfil do mesmo paciente**
   - Ir em "Pacientes"
   - Clicar no paciente testado

3. **Ver aba "Resumo"**
   - Deve estar na aba "Resumo" por padrão

4. **Verificar card "Aderência (7 dias)"**
   - ✅ Deve mostrar: 67%
   - ✅ Deve mostrar: 2/3 tarefas
   - (67% porque 2 de 3 tarefas estão marcadas)

5. **Marcar mais uma tarefa (teste de atualização)**
   - Ir para aba "Checklist"
   - Ver que realmente tem 2 tarefas marcadas
   - (Como profissional não pode marcar, pedir para paciente marcar ou testar diretamente no dashboard do paciente)

---

## ✅ Checklist de Validação Final

| Funcionalidade | ✅/❌ |
|----------------|-------|
| **SQL executado no Supabase** | ⬜ |
| **Professional consegue criar tarefa** | ⬜ |
| **Professional consegue editar título** | ⬜ |
| **Professional consegue excluir tarefa** | ⬜ |
| **Professional NÃO consegue marcar tarefa** | ⬜ |
| **Paciente vê tarefas criadas** | ⬜ |
| **Paciente consegue marcar/desmarcar** | ⬜ |
| **Paciente NÃO vê botões criar/editar/excluir** | ⬜ |
| **Estado persiste após reload** | ⬜ |
| **Barra de progresso atualiza corretamente** | ⬜ |
| **Contador (X/Y) atualiza corretamente** | ⬜ |
| **Aderência no resumo calcula certo** | ⬜ |

---

## 🐛 Possíveis Problemas

### **Problema:** "Erro ao carregar checklist"
**Solução:** 
1. Verificar se SQL foi executado no Supabase
2. Verificar se RLS está ativado
3. Verificar logs do console (F12)

### **Problema:** "Tarefas não aparecem para o paciente"
**Solução:**
1. Verificar se tarefas foram criadas para o paciente correto
2. Verificar patient_id na tabela checklist_tasks
3. Testar RLS: `SELECT * FROM checklist_tasks WHERE patient_id = 'UUID_DO_PACIENTE'`

### **Problema:** "Não consigo editar título"
**Solução:**
1. Verificar se está logado como profissional/admin
2. Verificar se isPatientView={false} no PatientProfile
3. Verificar logs do console

### **Problema:** "Estado não persiste após reload"
**Solução:**
1. Verificar conexão com Supabase
2. Verificar se updateChecklistTask está salvando no banco
3. Verificar logs de rede (F12 → Network)

---

## 📊 Exemplo de Resultado Esperado

Após testes completos:

```
PROFISSIONAL (PatientProfile > Checklist):
┌─────────────────────────────────────┐
│ Checklist Diário           0/3 (0%) │
├─────────────────────────────────────┤
│ ○ Beber 2,5L de água        ✏️ ✖️   │
│ ○ Tomar café às 8h          ✏️ ✖️   │
│ ○ Almoçar às 12h            ✏️ ✖️   │
├─────────────────────────────────────┤
│ [Nova tarefa...] [Adicionar]        │
└─────────────────────────────────────┘

PACIENTE (PatientDashboard):
┌─────────────────────────────────────┐
│ Checklist Diário          2/3 (67%) │
├─────────────────────────────────────┤
│ ✓ Beber 2,5L de água (riscado)      │
│ ✓ Tomar café às 8h (riscado)        │
│ ○ Almoçar às 12h                    │
└─────────────────────────────────────┘
```

---

## 🎯 Conclusão

Se todos os checkboxes acima estiverem ✅, o Checklist Diário MVP está **100% funcional**! 🎉
