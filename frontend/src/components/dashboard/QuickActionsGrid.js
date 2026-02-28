import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, ClipboardList, Copy, BarChart3 } from 'lucide-react';

/**
 * Grid de Ações Rápidas
 * @param {Object} props
 * @param {Array} props.actions - Lista de ações com { icon, label, onClick, color }
 */
const QuickActionsGrid = ({ actions = [], onAction }) => {
  const defaultActions = [
    {
      id: 'create_plan',
      icon: Plus,
      label: 'Criar Plano',
      color: 'bg-teal-600 hover:bg-teal-700',
      action: 'createPlan'
    },
    {
      id: 'send_feedback',
      icon: MessageSquare,
      label: 'Enviar Feedback',
      color: 'bg-blue-600 hover:bg-blue-700',
      action: 'sendFeedback'
    },
    {
      id: 'create_checklist',
      icon: ClipboardList,
      label: 'Criar Checklist',
      color: 'bg-purple-600 hover:bg-purple-700',
      action: 'createChecklist'
    },
    {
      id: 'duplicate_plan',
      icon: Copy,
      label: 'Duplicar Plano',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: 'duplicatePlan'
    },
    {
      id: 'reports',
      icon: BarChart3,
      label: 'Ver Relatórios',
      color: 'bg-orange-600 hover:bg-orange-700',
      action: 'viewReports'
    }
  ];

  const actionsToRender = actions.length > 0 ? actions : defaultActions;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {actionsToRender.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            onClick={() => onAction && onAction(action.action)}
            className={`${action.color} text-white h-auto py-4 flex-col gap-2 shadow-sm hover:shadow-md transition-all`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default QuickActionsGrid;
