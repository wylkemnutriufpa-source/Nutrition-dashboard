import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de Alertas de Atenção
 * @param {Object} props
 * @param {Array} props.alerts - Lista de alertas
 * @param {Function} props.onAction - Callback para ações (sendReminder, sendFeedback)
 */
const AttentionAlert = ({ alerts = [], onAction }) => {
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">
            Tudo em Ordem!
          </h3>
          <p className="text-sm text-green-700">
            Nenhum paciente precisa de atenção urgente no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAction = (action, patientId) => {
    if (action.type === 'link') {
      navigate(action.link);
    } else if (action.type === 'action' && onAction) {
      onAction(action.action, patientId);
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Atenção Hoje
          <span className="ml-auto text-sm font-normal text-gray-500">
            {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 rounded-lg border-2 bg-white hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div className={`${alert.iconBg} p-2 rounded-lg flex-shrink-0`}>
                <span className="text-2xl">{alert.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {alert.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {alert.message}
                </p>
                <div className="flex flex-wrap gap-2">
                  {alert.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      onClick={() => handleAction(action, alert.patientId)}
                      size="sm"
                      variant={idx === 0 ? 'default' : 'outline'}
                      className={idx === 0 ? 'bg-teal-600 hover:bg-teal-700' : ''}
                    >
                      {action.label}
                      {action.type === 'link' && <ArrowRight className="ml-1 h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AttentionAlert;
