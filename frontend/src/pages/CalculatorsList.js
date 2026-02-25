import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Droplet, Activity, Sparkles } from 'lucide-react';

const CalculatorsList = ({ userType = 'visitor' }) => {
  const navigate = useNavigate();

  const healthCheck = {
    id: 'health-check',
    title: 'Check Nutricional Inteligente',
    description: 'Avaliação gratuita e personalizada do seu estado nutricional',
    icon: Activity,
    color: 'from-purple-600 to-blue-600',
    path: `/${userType}/health-check`,
    badge: 'NOVO',
    featured: true
  };

  const calculators = [
    {
      id: 'weight',
      title: 'Calculadora de Peso de Referência',
      description: 'Calcule seu peso ideal baseado em diversos parâmetros',
      icon: Scale,
      color: 'from-teal-700 to-teal-600',
      path: `/${userType}/calculator/weight`
    },
    {
      id: 'water',
      title: 'Calculadora de Água',
      description: 'Descubra quanto de água você deve beber por dia',
      icon: Droplet,
      color: 'from-blue-600 to-blue-500',
      path: `/${userType}/calculator/water`
    }
  ];

  return (
    <Layout title="Ferramentas" userType={userType}>
      <div data-testid="calculators-list" className="max-w-5xl mx-auto">
        <p className="text-gray-600 mb-8">Ferramentas para ajudá-lo em sua jornada de saúde</p>
        
        {/* Health Check Destacado */}
        <Card
          className="mb-8 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white relative overflow-hidden"
          onClick={() => navigate(healthCheck.path)}
        >
          {/* Badge NOVO */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Sparkles size={12} />
              {healthCheck.badge}
            </span>
          </div>

          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${healthCheck.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <healthCheck.icon className="text-white" size={40} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{healthCheck.title}</CardTitle>
                <CardDescription className="text-base">{healthCheck.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                data-testid="health-check-button"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Activity size={20} />
                Começar Avaliação Gratuita
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                ✨ 5 perguntas rápidas
              </span>
              <span className="flex items-center gap-1">
                🎯 Resultado personalizado
              </span>
              <span className="flex items-center gap-1">
                📧 Receba por email
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Calculadoras */}
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Calculadoras</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {calculators.map((calc) => (
            <Card
              key={calc.id}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-teal-700"
              onClick={() => navigate(calc.path)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${calc.color} flex items-center justify-center mb-4`}>
                  <calc.icon className="text-white" size={32} />
                </div>
                <CardTitle>{calc.title}</CardTitle>
                <CardDescription>{calc.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  data-testid={`calculator-${calc.id}-button`}
                  className="w-full px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium transition-colors"
                >
                  Iniciar Cálculo
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CalculatorsList;