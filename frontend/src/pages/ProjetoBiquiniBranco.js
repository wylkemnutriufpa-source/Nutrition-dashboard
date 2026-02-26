import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, UserCheck, Utensils, Activity, Trophy, 
  MessageCircle, Instagram, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import WhatsAppFloating from '@/components/WhatsAppFloating';

const ProjetoBiquiniBranco = () => {
  const navigate = useNavigate();
  const [showcaseData, setShowcaseData] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    // TODO: Buscar do Supabase (project_showcase)
    // Por enquanto, dados padrão
    setShowcaseData({
      projectName: 'Projeto Biquíni Branco',
      hero: {
        title: 'Projeto Biquíni Branco',
        subtitle: 'Transforme seu corpo e conquiste o biquíni dos seus sonhos em 90 dias',
        ctaText: 'Quero Participar',
        backgroundImage: ''
      },
      howItWorks: {
        title: 'Como Funciona',
        steps: [
          { icon: 'UserCheck', title: 'Avaliação Inicial', description: 'Análise completa do seu perfil e objetivos' },
          { icon: 'Utensils', title: 'Plano Personalizado', description: 'Cardápio sob medida para o seu metabolismo' },
          { icon: 'Activity', title: 'Acompanhamento', description: 'Suporte diário e ajustes constantes' },
          { icon: 'Trophy', title: 'Resultados', description: 'Transformação real em 90 dias' }
        ]
      },
      plans: [
        { name: 'Mensal', price: 'R$ 297', duration: '30 dias', features: ['Plano alimentar', 'Checklist diário', 'Suporte WhatsApp'] },
        { name: 'Trimestral', price: 'R$ 697', duration: '90 dias', features: ['Plano alimentar', 'Checklist diário', 'Suporte WhatsApp', 'Receitas exclusivas'], highlight: true },
        { name: 'Semestral', price: 'R$ 1197', duration: '180 dias', features: ['Plano alimentar', 'Checklist diário', 'Suporte WhatsApp', 'Receitas exclusivas', 'Suplementação'] },
        { name: 'Anual', price: 'R$ 1997', duration: '365 dias', features: ['Tudo incluso', 'Prioridade no atendimento', 'Grupo VIP'] }
      ],
      testimonials: [
        { name: 'Ana Silva', text: 'Perdi 12kg em 3 meses! Melhor investimento da minha vida.', image: '', result: '-12kg' },
        { name: 'Carla Santos', text: 'Finalmente consegui usar biquíni com confiança!', image: '', result: '-8kg' },
        { name: 'Mariana Costa', text: 'Mudou minha relação com a comida. Não passo fome e perdi 10kg!', image: '', result: '-10kg' }
      ],
      beforeAfter: [
        { name: 'Júlia', before: '', after: '', result: '-15kg em 90 dias' }
      ],
      faq: [
        { question: 'Como funciona o acompanhamento?', answer: 'Você terá acesso a uma plataforma exclusiva com seu plano, tarefas diárias e suporte direto comigo via WhatsApp.' },
        { question: 'Preciso malhar?', answer: 'Não é obrigatório, mas atividade física potencializa os resultados. Adaptamos o plano ao seu estilo de vida.' },
        { question: 'Quanto tempo até ver resultados?', answer: 'A maioria das pessoas nota mudanças nas primeiras 2 semanas, mas a transformação completa acontece em 90 dias.' },
        { question: 'Posso cancelar?', answer: 'Sim, você pode cancelar a qualquer momento. Mas tenho certeza que vai amar os resultados!' }
      ]
    });
  }, []);

  const getIcon = (iconName) => {
    const icons = {
      UserCheck: UserCheck,
      Utensils: Utensils,
      Activity: Activity,
      Trophy: Trophy
    };
    return icons[iconName] || Activity;
  };

  const handleCTA = (planName = '') => {
    const message = planName 
      ? `Olá! Quero participar do Projeto Biquíni Branco - Plano ${planName}!`
      : 'Olá! Quero saber mais sobre o Projeto Biquíni Branco!';
    
    window.open(`https://wa.me/5591980124814?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!showcaseData) {
    return <Layout title="Carregando..." userType="visitor"><div>Carregando...</div></Layout>;
  }

  return (
    <Layout title={showcaseData.projectName} userType="visitor">
      {/* WhatsApp Flutuante */}
      <WhatsAppFloating 
        phoneNumber="5591980124814"
        message="Olá! Quero saber mais sobre o Projeto Biquíni Branco!"
      />

      <div className="space-y-16">
        {/* HERO SECTION */}
        <section className="relative -mt-6 -mx-6 px-6 py-20 bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {showcaseData.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              {showcaseData.hero.subtitle}
            </p>
            <Button 
              onClick={() => handleCTA()}
              className="bg-pink-600 hover:bg-pink-700 text-white text-lg px-8 py-6"
              size="lg"
            >
              {showcaseData.hero.ctaText}
            </Button>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            {showcaseData.howItWorks.title}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {showcaseData.howItWorks.steps.map((step, index) => {
              const Icon = getIcon(step.icon);
              return (
                <Card key={index} className="text-center hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <Icon className="text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* PLANOS */}
        <section className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Escolha Seu Plano
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Investimento no seu corpo e autoestima
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {showcaseData.plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlight ? 'border-4 border-pink-500 shadow-2xl transform scale-105' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MAIS POPULAR
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-4xl font-bold text-pink-600 my-2">{plan.price}</p>
                  <p className="text-gray-600">{plan.duration}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-center">
                      <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={18} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                  <Button 
                    onClick={() => handleCTA(plan.name)}
                    className={`w-full mt-4 ${plan.highlight ? 'bg-pink-600 hover:bg-pink-700' : 'bg-gray-700 hover:bg-gray-800'}`}
                  >
                    Escolher {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section className="max-w-6xl mx-auto bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-12">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Transformações Reais
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {showcaseData.testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-pink-600 font-semibold">{testimonial.result}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="text-yellow-400 fill-current" size={16} />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {showcaseData.faq.map((item, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent 
                  className="pt-6"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="text-pink-600" size={24} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={24} />
                    )}
                  </div>
                  {expandedFaq === index && (
                    <p className="mt-4 text-gray-700">{item.answer}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-pink-600 to-purple-600 text-white">
            <CardContent className="py-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Pronta para Transformar Seu Corpo?</h2>
              <p className="text-xl mb-8 opacity-90">
                Junte-se a centenas de mulheres que já conquistaram o corpo dos sonhos
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => handleCTA()}
                  className="bg-white text-pink-600 hover:bg-gray-100 text-lg px-8 py-6"
                  size="lg"
                >
                  <MessageCircle className="mr-2" size={20} />
                  Falar com Nutricionista
                </Button>
                <Button 
                  onClick={() => window.open('https://www.instagram.com/dr_wylkem_raiol/', '_blank')}
                  className="bg-white/20 hover:bg-white/30 text-white border-2 border-white text-lg px-8 py-6"
                  size="lg"
                >
                  <Instagram className="mr-2" size={20} />
                  Ver Transformações
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default ProjetoBiquiniBranco;
