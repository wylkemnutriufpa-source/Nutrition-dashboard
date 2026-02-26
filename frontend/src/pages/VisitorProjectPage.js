import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, CheckCircle, Star, Users, Calendar, 
  Utensils, TrendingUp, Heart, ArrowRight, Sparkles,
  Clock, Shield, Award
} from 'lucide-react';
import { getProjectCTAConfig } from '@/lib/supabase';

const VisitorProjectPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await getProjectCTAConfig(null);
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    config?.whatsapp_message || 
    'Olá! Gostaria de saber mais sobre o projeto de acompanhamento nutricional.'
  );
  const whatsappUrl = `https://wa.me/${config?.whatsapp_number || '5591980124814'}?text=${whatsappMessage}`;

  const benefits = config?.project_benefits || [
    'Plano alimentar 100% personalizado',
    'Acompanhamento semanal',
    'Receitas exclusivas',
    'Suporte via WhatsApp'
  ];

  const features = [
    {
      icon: Utensils,
      title: 'Plano Alimentar Personalizado',
      description: 'Dieta elaborada especialmente para suas necessidades, preferências e objetivos.'
    },
    {
      icon: Calendar,
      title: 'Acompanhamento Contínuo',
      description: 'Consultas de retorno para ajustar seu plano conforme sua evolução.'
    },
    {
      icon: TrendingUp,
      title: 'Acompanhe sua Jornada',
      description: 'Registre seu progresso com fotos, medidas e histórico de peso.'
    },
    {
      icon: Heart,
      title: 'Suporte Humanizado',
      description: 'Atendimento personalizado e suporte para suas dúvidas do dia a dia.'
    }
  ];

  const testimonials = [
    {
      name: 'Maria S.',
      text: 'Em 3 meses perdi 12kg de forma saudável. O acompanhamento fez toda a diferença!',
      rating: 5
    },
    {
      name: 'João P.',
      text: 'Finalmente consegui ganhar massa muscular com um plano que se encaixa na minha rotina.',
      rating: 5
    },
    {
      name: 'Ana C.',
      text: 'Adorei as receitas! Consegui emagrecer comendo bem e sem passar fome.',
      rating: 5
    }
  ];

  const steps = [
    { number: 1, title: 'Contato Inicial', description: 'Entre em contato pelo WhatsApp para agendar sua consulta.' },
    { number: 2, title: 'Avaliação Completa', description: 'Analisamos seu histórico, hábitos e objetivos.' },
    { number: 3, title: 'Plano Personalizado', description: 'Receba seu plano alimentar e comece sua transformação.' },
    { number: 4, title: 'Acompanhamento', description: 'Consultas de retorno para ajustes e suporte contínuo.' }
  ];

  return (
    <Layout title="Conheça o Projeto" showBack userType="visitor">
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-teal-100 to-green-100 rounded-full">
              <Sparkles className="w-12 h-12 text-teal-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {config?.project_name || 'FitJourney'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {config?.project_description || 'Transforme sua saúde com acompanhamento nutricional profissional'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-700 text-white py-6 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <MessageCircle className="mr-2 w-5 h-5" />
                Quero Começar Agora
              </Button>
            </a>
          </div>
        </div>

        {/* Benefits Grid */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-teal-50 to-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Por que escolher nosso acompanhamento?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">O que você terá acesso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-teal-100 rounded-lg">
                        <Icon className="w-6 h-6 text-teal-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <Card className="bg-gradient-to-br from-gray-50 to-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Como Funciona</CardTitle>
            <CardDescription>Seu caminho para uma vida mais saudável em 4 passos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-12 h-12 bg-teal-700 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    {step.number}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">O que nossos pacientes dizem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4">"{testimonial.text}"</p>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-10 h-10 text-teal-600" />
            <div>
              <p className="font-bold text-2xl text-gray-900">+5 anos</p>
              <p className="text-gray-600 text-sm">de experiência</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Users className="w-10 h-10 text-teal-600" />
            <div>
              <p className="font-bold text-2xl text-gray-900">+500</p>
              <p className="text-gray-600 text-sm">pacientes atendidos</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Award className="w-10 h-10 text-teal-600" />
            <div>
              <p className="font-bold text-2xl text-gray-900">CRN</p>
              <p className="text-gray-600 text-sm">Profissional habilitado</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <Card className="bg-gradient-to-br from-teal-700 to-teal-900 text-white border-none shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              Pronto para transformar sua saúde?
            </h2>
            <p className="text-teal-100 text-lg max-w-xl mx-auto">
              Entre em contato agora mesmo e comece sua jornada rumo a uma vida mais saudável.
            </p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-500 hover:bg-green-600 text-white py-6 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <MessageCircle className="mr-2 w-5 h-5" />
                Falar com o Nutricionista
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default VisitorProjectPage;
