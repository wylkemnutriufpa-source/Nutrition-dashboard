import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { getProjectCTAConfig } from '@/lib/supabase';

// Categorias de IMC
const getCategory = (imc) => {
  if (!imc) return 'default';
  const imcValue = parseFloat(imc);
  if (imcValue < 18.5) return 'magreza';
  if (imcValue < 25) return 'normal';
  if (imcValue < 30) return 'sobrepeso';
  return 'obesidade';
};

const ProjectCTA = ({ 
  imc = null, 
  category = null, // Se passado diretamente, usa esse
  calculatorType = 'peso', // peso, agua, etc
  customTitle = null,
  customDescription = null,
  showProjectButton = true,
  showWhatsAppButton = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Por enquanto usa config padrão (futuramente pode pegar de um profissional específico)
      const { data } = await getProjectCTAConfig(null);
      setConfig(data);
    } catch (error) {
      console.error('Error loading CTA config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determina a categoria baseada no IMC ou usa a passada diretamente
  const currentCategory = category || getCategory(imc);
  
  // Pega os textos da categoria ou usa default
  const texts = config?.texts?.[currentCategory] || config?.texts?.default || {
    title: 'Quer um plano alimentar personalizado?',
    description: 'Com base nas suas respostas, você pode ter um plano totalmente personalizado.'
  };

  const title = customTitle || texts.title;
  const description = customDescription || texts.description;

  // Monta mensagem do WhatsApp
  const whatsappMessage = encodeURIComponent(
    config?.whatsapp_message || 
    `Olá! Acabei de usar a calculadora de ${calculatorType} no FitJourney e gostaria de saber mais sobre o projeto.`
  );
  const whatsappUrl = `https://wa.me/${config?.whatsapp_number || '5591980124814'}?text=${whatsappMessage}`;

  // Benefícios padrão
  const benefits = config?.project_benefits || [
    'Plano alimentar 100% personalizado',
    'Acompanhamento semanal',
    'Receitas exclusivas',
    'Suporte via WhatsApp'
  ];

  if (loading) {
    return null;
  }

  return (
    <Card className={`mt-8 border-2 border-teal-600 bg-gradient-to-br from-teal-50 via-white to-green-50 shadow-lg overflow-hidden ${className}`}>
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-200/30 to-green-200/30 rounded-full -translate-y-16 translate-x-16" />
      
      <CardHeader className="text-center pb-4 relative">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-teal-100 rounded-full">
            <Sparkles className="w-8 h-8 text-teal-600" />
          </div>
        </div>
        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </CardTitle>
        <CardDescription className="text-base md:text-lg mt-2 text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm md:text-base">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {showProjectButton && (
            <Button
              onClick={() => navigate('/visitor/projeto')}
              className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              Conhecer o Projeto
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
          
          {showWhatsAppButton && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
                size="lg"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                Falar no WhatsApp
              </Button>
            </a>
          )}
        </div>

        {/* Mensagem de urgência baseada na categoria */}
        {currentCategory === 'obesidade' && (
          <p className="text-center text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
            ⚠️ Recomendamos buscar acompanhamento profissional o quanto antes para cuidar da sua saúde.
          </p>
        )}
        {currentCategory === 'magreza' && (
          <p className="text-center text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
            💪 Ganhar peso de forma saudável requer orientação nutricional adequada.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCTA;
