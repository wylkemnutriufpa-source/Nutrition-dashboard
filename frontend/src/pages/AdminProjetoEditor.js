import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, Plus, Trash2, Loader2, Eye, Sparkles, 
  MessageCircle, DollarSign, Users, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const AdminProjetoEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  
  const [projectData, setProjectData] = useState({
    projectName: 'Projeto Biquíni Branco',
    heroSubtitle: 'EMAGRECIMENTO INTELIGENTE',
    heroTagline: 'Um processo completo para emagrecer com saúde, sem efeito sanfona e sem sofrimento.',
    
    myths: [
      'Emagrecer em 1 mês é furada',
      'Remédio não resolve',
      'O resultado só permanece quando você aprende a comer',
      'A mudança começa na mente e reflete no corpo'
    ],
    
    benefits: [
      { icon: 'Calendar', text: '3 meses de acompanhamento' },
      { icon: 'Utensils', text: '3 ajustes estratégicos na dieta' },
      { icon: 'Clock', text: 'Mudança de protocolo a cada 30 dias' }
    ],
    
    biweeklyTasks: ['Envio de peso', 'Fotos de acompanhamento'],
    
    supportGroups: [
      { icon: 'Users', text: 'Grupo de bate-papo' },
      { icon: 'Camera', text: 'Fotos das refeições' },
      { icon: 'Dumbbell', text: 'Treinos e academia' }
    ],
    
    plans: [
      { 
        name: 'TRIMESTRAL', 
        price: 'R$ 200', 
        priceNote: 'Plano trimestral',
        tagline: '3 MESES DE FOCO TOTAL',
        features: ['Plano alimentar personalizado', 'Checklist diário', 'Suporte WhatsApp', 'Ajustes a cada 30 dias', 'Acesso aos 2 grupos'],
        highlight: true
      },
      { 
        name: 'SEMESTRAL', 
        price: 'R$ 360', 
        priceNote: 'Economia de R$40',
        tagline: '6 MESES PARA TRANSFORMAR',
        features: ['Tudo do plano trimestral', 'Receitas exclusivas', 'Prioridade no atendimento', 'Suplementação básica'],
        highlight: false
      },
      { 
        name: 'ANUAL', 
        price: 'R$ 660', 
        priceNote: 'Melhor custo-benefício',
        tagline: '1 ANO PELA SUA SAÚDE',
        features: ['Tudo dos planos anteriores', 'Grupo VIP exclusivo', 'Consultas extras', 'Bônus surpresa'],
        highlight: false
      }
    ],
    
    testimonials: [
      { name: 'Ana Paula', text: 'Perdi 12kg em 3 meses! Finalmente entendi como comer direito.', result: '-12kg' },
      { name: 'Carla Santos', text: 'O suporte no grupo faz toda diferença. Não me sinto sozinha!', result: '-8kg' },
      { name: 'Mariana Costa', text: 'Sem passar fome e sem efeito sanfona. Recomendo muito!', result: '-10kg' }
    ],
    
    faq: [
      { question: 'Como funciona o acompanhamento?', answer: 'Você terá acesso à plataforma FitJourney com seu plano personalizado, tarefas diárias, e suporte direto comigo via WhatsApp.' },
      { question: 'Preciso malhar?', answer: 'Não é obrigatório, mas atividade física potencializa os resultados.' },
      { question: 'Vou passar fome?', answer: 'De jeito nenhum! O diferencial do programa é ensinar você a comer de forma inteligente.' },
      { question: 'E se eu não conseguir seguir?', answer: 'Por isso temos os grupos de suporte! Você não está sozinha.' }
    ],
    
    ctaMain: 'QUERO TRANSFORMAR MEU CORPO',
    ctaUrgency: '🔥 VAGAS LIMITADAS',
    ctaEmotional: 'Seu biquíni branco não vai se conquistar sozinho. Garanta sua vaga agora e comece a mudança hoje!',
    
    whatsappNumber: '5591980124814',
    instagramUrl: 'https://www.instagram.com/dr_wylkem_raiol/'
  });

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    try {
      const { data, error } = await supabase
        .from('project_showcase')
        .select('*')
        .eq('project_key', 'biquini_branco')
        .maybeSingle();

      if (data?.config) {
        setProjectData(prev => ({ ...prev, ...data.config }));
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('project_showcase')
        .upsert({
          project_key: 'biquini_branco',
          config: projectData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_key' });

      if (error) throw error;
      
      toast.success('Projeto salvo com sucesso! 🎉');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar. Verifique se a tabela existe no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (arrayName, index, value) => {
    setProjectData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (arrayName, newItem) => {
    setProjectData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], newItem]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setProjectData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const updatePlan = (index, field, value) => {
    setProjectData(prev => ({
      ...prev,
      plans: prev.plans.map((plan, i) => i === index ? { ...plan, [field]: value } : plan)
    }));
  };

  const updatePlanFeature = (planIndex, featureIndex, value) => {
    setProjectData(prev => ({
      ...prev,
      plans: prev.plans.map((plan, i) => {
        if (i !== planIndex) return plan;
        return {
          ...plan,
          features: plan.features.map((f, fi) => fi === featureIndex ? value : f)
        };
      })
    }));
  };

  if (loading) {
    return (
      <Layout title="Editor do Projeto" userType="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Editor - Projeto Biquíni Branco" userType="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editor do Projeto Biquíni Branco</h1>
            <p className="text-gray-600">Personalize todo o conteúdo da página de vendas</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => window.open('/visitor/projeto', '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-100">
            <TabsTrigger value="hero">
              <Sparkles className="h-4 w-4 mr-1" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="conteudo">
              <MessageCircle className="h-4 w-4 mr-1" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="planos">
              <DollarSign className="h-4 w-4 mr-1" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="depoimentos">
              <Users className="h-4 w-4 mr-1" />
              Depoimentos
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="h-4 w-4 mr-1" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Tab Hero */}
          <TabsContent value="hero" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Seção Principal (Hero)</CardTitle>
                <CardDescription>Textos que aparecem no topo da página</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome do Projeto</Label>
                  <Input
                    value={projectData.projectName}
                    onChange={(e) => updateField('projectName', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Subtítulo (destaque em amarelo)</Label>
                  <Input
                    value={projectData.heroSubtitle}
                    onChange={(e) => updateField('heroSubtitle', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Textarea
                    value={projectData.heroTagline}
                    onChange={(e) => updateField('heroTagline', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Texto do Botão Principal</Label>
                    <Input
                      value={projectData.ctaMain}
                      onChange={(e) => updateField('ctaMain', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Texto de Urgência</Label>
                    <Input
                      value={projectData.ctaUrgency}
                      onChange={(e) => updateField('ctaUrgency', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>CTA Emocional (seção final)</Label>
                  <Textarea
                    value={projectData.ctaEmotional}
                    onChange={(e) => updateField('ctaEmotional', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>WhatsApp (apenas números)</Label>
                    <Input
                      value={projectData.whatsappNumber}
                      onChange={(e) => updateField('whatsappNumber', e.target.value)}
                      placeholder="5591980124814"
                    />
                  </div>
                  <div>
                    <Label>URL do Instagram</Label>
                    <Input
                      value={projectData.instagramUrl}
                      onChange={(e) => updateField('instagramUrl', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Conteúdo */}
          <TabsContent value="conteudo" className="space-y-4 mt-4">
            {/* Mitos */}
            <Card>
              <CardHeader>
                <CardTitle>Verdades/Mitos</CardTitle>
                <CardDescription>Pontos que aparecem com checkmarks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectData.myths.map((myth, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={myth}
                      onChange={(e) => updateArrayItem('myths', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeArrayItem('myths', index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => addArrayItem('myths', 'Novo ponto')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Ponto
                </Button>
              </CardContent>
            </Card>

            {/* Benefícios */}
            <Card>
              <CardHeader>
                <CardTitle>O que você vai ter</CardTitle>
                <CardDescription>Benefícios do programa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit.text}
                      onChange={(e) => updateArrayItem('benefits', index, { ...benefit, text: e.target.value })}
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeArrayItem('benefits', index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => addArrayItem('benefits', { icon: 'Activity', text: 'Novo benefício' })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Benefício
                </Button>
              </CardContent>
            </Card>

            {/* Tarefas quinzenais */}
            <Card>
              <CardHeader>
                <CardTitle>A cada 15 dias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectData.biweeklyTasks.map((task, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={task}
                      onChange={(e) => updateArrayItem('biweeklyTasks', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeArrayItem('biweeklyTasks', index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => addArrayItem('biweeklyTasks', 'Nova tarefa')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Tarefa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Planos */}
          <TabsContent value="planos" className="space-y-4 mt-4">
            {projectData.plans.map((plan, planIndex) => (
              <Card key={planIndex} className={plan.highlight ? 'border-2 border-pink-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Plano {plan.name}</span>
                    <label className="flex items-center gap-2 text-sm font-normal">
                      <input
                        type="checkbox"
                        checked={plan.highlight}
                        onChange={(e) => updatePlan(planIndex, 'highlight', e.target.checked)}
                      />
                      Destacar
                    </label>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={plan.name}
                        onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Preço</Label>
                      <Input
                        value={plan.price}
                        onChange={(e) => updatePlan(planIndex, 'price', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nota do Preço</Label>
                      <Input
                        value={plan.priceNote}
                        onChange={(e) => updatePlan(planIndex, 'priceNote', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input
                        value={plan.tagline}
                        onChange={(e) => updatePlan(planIndex, 'tagline', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Features (uma por linha)</Label>
                    <div className="space-y-2">
                      {plan.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => updatePlanFeature(planIndex, fIndex, e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              const newFeatures = plan.features.filter((_, i) => i !== fIndex);
                              updatePlan(planIndex, 'features', newFeatures);
                            }}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updatePlan(planIndex, 'features', [...plan.features, 'Nova feature'])}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Feature
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab Depoimentos */}
          <TabsContent value="depoimentos" className="space-y-4 mt-4">
            {projectData.testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={testimonial.name}
                        onChange={(e) => updateArrayItem('testimonials', index, { ...testimonial, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Resultado (ex: -12kg)</Label>
                      <Input
                        value={testimonial.result}
                        onChange={(e) => updateArrayItem('testimonials', index, { ...testimonial, result: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Depoimento</Label>
                    <Textarea
                      value={testimonial.text}
                      onChange={(e) => updateArrayItem('testimonials', index, { ...testimonial, text: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeArrayItem('testimonials', index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover Depoimento
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button 
              variant="outline" 
              onClick={() => addArrayItem('testimonials', { name: 'Nome', text: 'Depoimento aqui...', result: '-Xkg' })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Depoimento
            </Button>
          </TabsContent>

          {/* Tab FAQ */}
          <TabsContent value="faq" className="space-y-4 mt-4">
            {projectData.faq.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label>Pergunta</Label>
                    <Input
                      value={item.question}
                      onChange={(e) => updateArrayItem('faq', index, { ...item, question: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Resposta</Label>
                    <Textarea
                      value={item.answer}
                      onChange={(e) => updateArrayItem('faq', index, { ...item, answer: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeArrayItem('faq', index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover Pergunta
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button 
              variant="outline" 
              onClick={() => addArrayItem('faq', { question: 'Nova pergunta?', answer: 'Resposta aqui...' })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminProjetoEditor;
