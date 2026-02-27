import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, CheckCircle2, Activity, Heart, Utensils, Download } from 'lucide-react';
import { toast } from 'sonner';
import { updateAnamnesis, createAnamnesis } from '@/lib/supabase';
import { generateAnamnesePDF } from '@/utils/pdfGenerator';

/**
 * AnamneseFormComplete - Formulário completo de anamnese
 * Inclui: Clínica + Esportiva
 * Pode ser preenchido por profissional OU paciente
 */
const AnamneseFormComplete = ({ 
  anamnesis, 
  patientId, 
  professionalId, 
  patient, 
  professionalInfo,
  isPatientView = false, // true se paciente está preenchendo
  onUpdate,
  onComplete 
}) => {
  const [data, setData] = useState(anamnesis || {});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentSection, setCurrentSection] = useState('clinical'); // clinical, lifestyle, nutrition, sports

  useEffect(() => {
    setData(anamnesis || {});
  }, [anamnesis]);

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Calcular progresso da anamnese
  const calculateProgress = () => {
    const fields = {
      clinical: ['medical_conditions_text', 'medications', 'allergies', 'food_intolerances'],
      lifestyle: ['smoking', 'alcohol', 'sleep_hours', 'stress_level', 'water_intake'],
      nutrition: ['meals_per_day', 'food_preference', 'favorite_foods', 'disliked_foods'],
      sports: ['exercises_regularly', 'physical_activity_level', 'sports_goal']
    };

    const total = Object.values(fields).flat().length;
    const filled = Object.values(fields).flat().filter(field => {
      const value = data[field];
      return value && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    return Math.round((filled / total) * 100);
  };

  const progress = calculateProgress();

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    try {
      const updates = {
        ...data,
        status: markComplete ? 'complete' : 'draft',
        last_edited_by: isPatientView ? 'patient' : 'professional'
      };
      
      if (anamnesis?.id) {
        const { error } = await updateAnamnesis(anamnesis.id, updates);
        if (error) throw error;
      } else {
        // Criar nova anamnese
        const { error } = await createAnamnesis({
          ...updates,
          patient_id: patientId,
          professional_id: professionalId
        });
        if (error) throw error;
      }
      
      toast.success(markComplete ? 'Anamnese concluída!' : 'Rascunho salvo!');
      setHasChanges(false);
      if (onUpdate) onUpdate();
      
      // Se marcar como completa, gerar pré-plano automaticamente
      if (markComplete && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving anamnesis:', error);
      toast.error('Erro ao salvar anamnese');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save a cada 30 segundos
  useEffect(() => {
    if (!hasChanges || !anamnesis?.id) return;
    const timer = setTimeout(() => {
      handleSave(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, [data, hasChanges]);

  const getSectionIcon = (section) => {
    switch (section) {
      case 'clinical': return <Heart size={16} />;
      case 'lifestyle': return <Activity size={16} />;
      case 'nutrition': return <Utensils size={16} />;
      case 'sports': return <Activity size={16} />;
      default: return null;
    }
  };

  const sections = [
    { id: 'clinical', label: 'Parte Clínica', icon: Heart },
    { id: 'lifestyle', label: 'Estilo de Vida', icon: Activity },
    { id: 'nutrition', label: 'Alimentação', icon: Utensils },
    { id: 'sports', label: 'Parte Esportiva', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={data.status === 'complete' ? 'default' : 'secondary'} className="text-sm">
                  {data.status === 'complete' ? '✓ Completa' : data.status === 'draft' ? '📝 Rascunho' : '⚠️ Incompleta'}
                </Badge>
                {hasChanges && <span className="text-xs text-amber-600">Alterações não salvas</span>}
                {isPatientView && (
                  <span className="text-xs text-blue-600">Modo: Paciente</span>
                )}
              </div>
              <div className="flex gap-2">
                {!isPatientView && professionalInfo && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      try {
                        generateAnamnesePDF(patient, anamnesis, professionalInfo);
                        toast.success('PDF gerado!');
                      } catch (error) {
                        toast.error('Erro ao gerar PDF');
                      }
                    }}
                  >
                    <Download size={14} className="mr-2" /> PDF
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => handleSave(false)} 
                  disabled={saving || !hasChanges}
                  size="sm"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={14} className="mr-2" />}
                  Salvar
                </Button>
                <Button 
                  className="bg-teal-700 hover:bg-teal-800" 
                  onClick={() => handleSave(true)} 
                  disabled={saving}
                  size="sm"
                >
                  <CheckCircle2 size={14} className="mr-2" />
                  Concluir
                </Button>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progresso da Anamnese</span>
                <span className="font-semibold text-teal-700">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {progress < 50 ? '📝 Continue preenchendo para desbloquear seu plano personalizado' : 
                 progress < 100 ? '✨ Quase lá! Complete as informações' : 
                 '🎉 Anamnese completa! Clique em "Concluir" para gerar seu plano'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegação de Seções */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={currentSection === section.id ? 'default' : 'outline'}
              onClick={() => setCurrentSection(section.id)}
              className="flex-shrink-0"
            >
              <Icon size={16} className="mr-2" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {/* PARTE CLÍNICA */}
      {currentSection === 'clinical' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Histórico Médico</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Condições Médicas Atuais</Label>
                <Textarea
                  value={data.medical_conditions_text || ''}
                  onChange={(e) => handleChange('medical_conditions_text', e.target.value)}
                  placeholder="Ex: Diabetes tipo 2, Hipertensão controlada com medicamento..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Medicamentos em Uso</Label>
                  <Textarea
                    value={data.medications || ''}
                    onChange={(e) => handleChange('medications', e.target.value)}
                    placeholder="Liste os medicamentos e dosagens"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Suplementos</Label>
                  <Textarea
                    value={data.supplements_current || ''}
                    onChange={(e) => handleChange('supplements_current', e.target.value)}
                    placeholder="Vitaminas, proteínas, etc"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Alergias Alimentares</Label>
                  <Input
                    value={data.allergies?.join(', ') || ''}
                    onChange={(e) => handleChange('allergies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Amendoim, Frutos do mar, Glúten"
                  />
                </div>
                <div>
                  <Label>Intolerâncias</Label>
                  <Input
                    value={data.food_intolerances?.join(', ') || ''}
                    onChange={(e) => handleChange('food_intolerances', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Lactose, Frutose"
                  />
                </div>
              </div>

              <div>
                <Label>Histórico Familiar de Doenças</Label>
                <Textarea
                  value={data.family_history || ''}
                  onChange={(e) => handleChange('family_history', e.target.value)}
                  placeholder="Diabetes, obesidade, problemas cardíacos na família?"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ESTILO DE VIDA */}
      {currentSection === 'lifestyle' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Hábitos de Vida</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Tabagismo</Label>
                  <Select value={data.smoking || ''} onValueChange={(v) => handleChange('smoking', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca fumou</SelectItem>
                      <SelectItem value="former">Ex-fumante</SelectItem>
                      <SelectItem value="current">Fumante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Álcool</Label>
                  <Select value={data.alcohol || ''} onValueChange={(v) => handleChange('alcohol', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Não bebe</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Horas de Sono</Label>
                  <Input
                    type="number"
                    value={data.sleep_hours || ''}
                    onChange={(e) => handleChange('sleep_hours', parseFloat(e.target.value) || null)}
                    placeholder="7"
                  />
                </div>
                <div>
                  <Label>Qualidade do Sono</Label>
                  <Select value={data.sleep_quality || ''} onValueChange={(v) => handleChange('sleep_quality', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excelente</SelectItem>
                      <SelectItem value="good">Boa</SelectItem>
                      <SelectItem value="fair">Regular</SelectItem>
                      <SelectItem value="poor">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nível de Estresse</Label>
                  <Select value={data.stress_level || ''} onValueChange={(v) => handleChange('stress_level', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="very_high">Muito Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Água por Dia (litros)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={data.water_intake || ''}
                    onChange={(e) => handleChange('water_intake', parseFloat(e.target.value) || null)}
                    placeholder="2.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ALIMENTAÇÃO */}
      {currentSection === 'nutrition' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Hábitos Alimentares</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Refeições por Dia</Label>
                  <Input
                    type="number"
                    value={data.meals_per_day || ''}
                    onChange={(e) => handleChange('meals_per_day', parseInt(e.target.value) || null)}
                    placeholder="3-6"
                  />
                </div>
                <div>
                  <Label>Come Fora (vezes/semana)</Label>
                  <Input
                    type="number"
                    value={data.eat_out_frequency || ''}
                    onChange={(e) => handleChange('eat_out_frequency', parseInt(e.target.value) || null)}
                    placeholder="0-7"
                  />
                </div>
                <div>
                  <Label>Preferência Alimentar</Label>
                  <Select value={data.food_preference || ''} onValueChange={(v) => handleChange('food_preference', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omnivore">Onívoro</SelectItem>
                      <SelectItem value="vegetarian">Vegetariano</SelectItem>
                      <SelectItem value="vegan">Vegano</SelectItem>
                      <SelectItem value="flexitarian">Flexitariano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Alimentos que mais gosta</Label>
                <Textarea
                  value={data.favorite_foods || ''}
                  onChange={(e) => handleChange('favorite_foods', e.target.value)}
                  placeholder="Liste seus alimentos favoritos"
                  rows={2}
                />
              </div>

              <div>
                <Label>Alimentos que não gosta / evita</Label>
                <Textarea
                  value={data.disliked_foods || ''}
                  onChange={(e) => handleChange('disliked_foods', e.target.value)}
                  placeholder="Alimentos que não gosta ou evita comer"
                  rows={2}
                />
              </div>

              <div>
                <Label>Dietas Anteriores</Label>
                <Textarea
                  value={data.previous_diets || ''}
                  onChange={(e) => handleChange('previous_diets', e.target.value)}
                  placeholder="Já fez alguma dieta? Qual foi o resultado?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PARTE ESPORTIVA */}
      {currentSection === 'sports' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>🏃‍♂️ Avaliação Esportiva</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pratica Atividade Física?</Label>
                  <Select value={data.exercises_regularly || ''} onValueChange={(v) => handleChange('exercises_regularly', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Sim, regularmente</SelectItem>
                      <SelectItem value="sometimes">Às vezes</SelectItem>
                      <SelectItem value="no">Não pratico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nível de Atividade</Label>
                  <Select value={data.physical_activity_level || ''} onValueChange={(v) => handleChange('physical_activity_level', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentário</SelectItem>
                      <SelectItem value="light">Leve (1-2x/semana)</SelectItem>
                      <SelectItem value="moderate">Moderado (3-4x/semana)</SelectItem>
                      <SelectItem value="active">Ativo (5-6x/semana)</SelectItem>
                      <SelectItem value="very_active">Muito Ativo (diário)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Modalidades Praticadas</Label>
                <Input
                  value={data.sports_modalities || ''}
                  onChange={(e) => handleChange('sports_modalities', e.target.value)}
                  placeholder="Ex: Musculação, Corrida, Natação, Futebol"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Frequência Semanal</Label>
                  <Input
                    type="number"
                    value={data.training_frequency || ''}
                    onChange={(e) => handleChange('training_frequency', parseInt(e.target.value) || null)}
                    placeholder="Ex: 4 vezes"
                  />
                </div>
                <div>
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    value={data.training_duration || ''}
                    onChange={(e) => handleChange('training_duration', parseInt(e.target.value) || null)}
                    placeholder="Ex: 60 min"
                  />
                </div>
                <div>
                  <Label>Horário Preferido</Label>
                  <Select value={data.training_time || ''} onValueChange={(v) => handleChange('training_time', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Manhã</SelectItem>
                      <SelectItem value="afternoon">Tarde</SelectItem>
                      <SelectItem value="evening">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Objetivo Principal</Label>
                <Select value={data.sports_goal || ''} onValueChange={(v) => handleChange('sports_goal', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione seu objetivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">🔥 Emagrecimento</SelectItem>
                    <SelectItem value="muscle_gain">💪 Ganho de Massa Muscular</SelectItem>
                    <SelectItem value="maintenance">⚖️ Manutenção</SelectItem>
                    <SelectItem value="health">❤️ Saúde e Bem-estar</SelectItem>
                    <SelectItem value="performance">⚡ Performance Esportiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Experiência com Treinos</Label>
                <Select value={data.training_experience || ''} onValueChange={(v) => handleChange('training_experience', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante (menos de 6 meses)</SelectItem>
                    <SelectItem value="intermediate">Intermediário (6 meses - 2 anos)</SelectItem>
                    <SelectItem value="advanced">Avançado (mais de 2 anos)</SelectItem>
                    <SelectItem value="athlete">Atleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Lesões ou Limitações Físicas</Label>
                <Textarea
                  value={data.injuries_limitations || ''}
                  onChange={(e) => handleChange('injuries_limitations', e.target.value)}
                  placeholder="Possui alguma lesão ou limitação que devemos considerar?"
                  rows={2}
                />
              </div>

              <div>
                <Label>Uso de Suplementos Esportivos</Label>
                <Textarea
                  value={data.sports_supplements || ''}
                  onChange={(e) => handleChange('sports_supplements', e.target.value)}
                  placeholder="Whey protein, creatina, BCAA, pré-treino, etc"
                  rows={2}
                />
              </div>

              <div>
                <Label>Competições ou Eventos Futuros</Label>
                <Input
                  value={data.upcoming_events || ''}
                  onChange={(e) => handleChange('upcoming_events', e.target.value)}
                  placeholder="Ex: Maratona em junho, campeonato de natação"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnamneseFormComplete;
