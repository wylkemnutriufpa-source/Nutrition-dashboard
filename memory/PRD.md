# PRD - FitJourney - Nutrition Dashboard

## Problema Original
Dashboard de nutrição com roles: Admin, Profissional, Paciente, Visitante. App em português para nutricionista Wylkem Raiol com projeto "Biquíni Branco".

## Stack Técnica
- Frontend: React + Tailwind CSS
- Backend: FastAPI (mínimo, apenas /api/status)
- DB + Auth: Supabase (PostgreSQL + RLS + Storage)
- A lógica principal está 100% no frontend via supabase.js

## Roles e Credenciais de Teste
- Admin/Profissional: wylkem.nutri.ufpa@gmail.com / 654321
- Paciente: Maria@gmail.com / 123456

## Arquitetura de Arquivos
```
frontend/src/
├── pages/
│   ├── ProjetoBiquiniBranco.js  ← Landing page dinâmica (visitante)
│   ├── AdminProjetoEditor.js    ← Editor da landing page (admin/profissional)
│   ├── PatientDashboard.js      ← Dashboard do paciente (com foto de perfil)
│   ├── PatientProfile.js        ← Perfil do paciente (visão profissional)
│   ├── PatientJornada.js        ← Jornada/progresso do paciente
│   ├── PatientFeedbacks.js      ← Feedbacks do paciente
│   ├── PatientTarefas.js        ← Tarefas do paciente
│   ├── PatientReceitas.js       ← Receitas do paciente
│   ├── PatientSuplementos.js    ← Suplementos do paciente
│   ├── PatientDicas.js          ← Dicas do paciente
│   └── PatientListaCompras.js   ← Lista de compras
├── components/
│   ├── Sidebar.js               ← Menu dinâmico por role
│   ├── Layout.js                ← Layout com sidebar
│   ├── MenuConfigEditor.js      ← Editor de menu do paciente
│   └── ProjectCTA.jsx           ← CTA reusável
├── lib/
│   └── supabase.js              ← Todas as funções Supabase
└── App.js                       ← Rotas protegidas por role
```

## Tabelas Supabase Necessárias
- `profiles` — id, email, name, role, status, photo_url, deleted_at
- `patient_menu_config` — patient_id, professional_id, menu_items (JSONB)
- `patient_journey` — patient_id, plan_name, plan_start_date, plan_end_date, initial_weight, target_weight, notes
- `weight_history` — patient_id, weight, notes, recorded_at
- `progress_photos` — patient_id, photo_url, photo_type, notes, taken_at
- `patient_feedbacks` — patient_id, message, mood, status, reply
- `project_showcase` — project_key, config (JSONB), created_at, updated_at
- `anamnesis` — patient_id, professional_id, + campos de saúde
- `meal_plans` — patient_id, professional_id, name, plan_data (JSONB), is_active
- `checklist_tasks` — patient_id, title, completed
- `patient_messages` — patient_id, professional_id, title, content, type, priority

## O que foi implementado (por data)

### Sessão 1 (setup inicial)
- Setup do repositório, instalação de dependências
- CTA Component (ProjectCTA.jsx) integrado nas calculadoras
- Menu dinâmico do paciente (patient_menu_config)
- Páginas do "Meu Projeto": Jornada, Receitas, Dicas, Suplementos, Lista de Compras

### Sessão 2
- Fix de permissões: pacientes não veem itens de profissional
- Redesign da página ProjetoBiquiniBranco.js (landing page)
- Criação do AdminProjetoEditor.js (editor completo com upload de imagens)
- Fix no Layout.js para visitantes não verem sidebar de admin

### Sessão 3 (26/02/2026)
- ProjetoBiquiniBranco.js: títulos de seções dinâmicos (Plans, Testimonials, FAQ, ctaFinal)
- ProjetoBiquiniBranco.js: planos filtrados pelo campo `active`
- ProjetoBiquiniBranco.js: depoimentos com imagens quando disponíveis
- PatientDashboard.js: widget de foto de perfil com upload via câmera
- lib/supabase.js: função uploadProfilePhoto() com fallback base64
- PatientProfile.js: exibe photo_url real do paciente (fallback para ui-avatars)

## SQLs Pendentes para Executar no Supabase
Ver arquivo /app/memory/SUPABASE_SQL.md

## Backlog (P0 → P2)
### P0
- Fix RLS do project_showcase para habilitar save do editor
- Fix RLS de tabelas do paciente (anamnesis, patient_journey)

### P1  
- Melhorias visuais na jornada do paciente
- Onboarding de novos usuários

### P2
- Gamificação (badges, conquistas)
- Notificações para profissional quando paciente envia feedback
- Relatórios de progresso exportáveis
