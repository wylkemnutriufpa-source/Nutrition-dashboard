import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Droplet } from 'lucide-react';

const CalculatorsList = ({ userType = 'visitor' }) => {
  const navigate = useNavigate();

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
    <Layout title="Calculadoras" userType={userType}>
      <div data-testid="calculators-list" className="max-w-4xl mx-auto">
        <p className="text-gray-600 mb-8">Ferramentas para ajudá-lo em sua jornada de saúde</p>
        
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