import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageCircle, Instagram, Mail } from 'lucide-react';

const CTACard = () => (
  <Card className="mt-8 border-2 border-teal-700 bg-gradient-to-br from-teal-50 to-green-50">
    <CardHeader className="text-center">
      <CardTitle className="text-2xl">Quer um plano alimentar personalizado?</CardTitle>
      <CardDescription className="text-base mt-2">
        Com base nas suas respostas, você pode ter um plano totalmente personalizado com acompanhamento profissional.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <a
        href="https://wa.me/5591980124814?text=Olá Dr. Wylkem, acabei de usar a calculadora no FitJourney e quero um plano personalizado."
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
          <MessageCircle className="mr-2" size={20} />
          Quero um Plano Alimentar Personalizado
        </Button>
      </a>
      
      <a
        href="https://www.instagram.com/dr_wylkem_raiol/"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" size="lg" variant="outline">
          <Instagram className="mr-2" size={20} />
          Falar com o Nutricionista
        </Button>
      </a>

      <a
        href="mailto:wylkem.nutri.ufpa@gmail.com"
        className="block"
      >
        <Button className="w-full" size="lg" variant="outline">
          <Mail className="mr-2" size={20} />
          Enviar E-mail
        </Button>
      </a>
    </CardContent>
  </Card>
);

const WaterCalculator = ({ userType = 'visitor' }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    weight: '',
    activityLevel: '',
    climate: '',
    currentIntake: '',
    routine: ''
  });
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const weight = parseFloat(formData.weight);
    let baseWater = weight * 35;

    if (formData.activityLevel === 'intenso') {
      baseWater += 500;
    } else if (formData.activityLevel === 'moderado') {
      baseWater += 300;
    } else if (formData.activityLevel === 'leve') {
      baseWater += 150;
    }

    if (formData.climate === 'quente') {
      baseWater += 300;
    }

    const recommendedWater = (baseWater / 1000).toFixed(1);
    const currentIntake = parseFloat(formData.currentIntake) || 0;
    const difference = (recommendedWater - currentIntake).toFixed(1);

    let diagnosis = '';
    if (currentIntake < recommendedWater * 0.7) {
      diagnosis = `Você está bebendo ${currentIntake}L por dia, mas deveria beber ${recommendedWater}L. Isso é significativamente abaixo do recomendado. Aumente gradualmente sua ingestão de água para evitar desidratação.`;
    } else if (currentIntake < recommendedWater) {
      diagnosis = `Você está próximo do ideal! Atualmente bebe ${currentIntake}L, mas o recomendado é ${recommendedWater}L. Aumente um pouco mais sua hidratação.`;
    } else {
      diagnosis = `Parabéns! Você está bem hidratado, bebendo ${currentIntake}L por dia. Continue assim!`;
    }

    setResult({
      recommendedWater,
      currentIntake,
      difference,
      diagnosis
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label>Peso (kg)</Label>
        <Input
          type="number"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          placeholder="70"
        />
      </div>

      <div>
        <Label>Nível de atividade física</Label>
        <RadioGroup value={formData.activityLevel} onValueChange={(v) => setFormData({ ...formData, activityLevel: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sedentario" id="water-sedentario" />
            <Label htmlFor="water-sedentario">Sedentário</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="leve" id="water-leve" />
            <Label htmlFor="water-leve">Atividade leve</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="moderado" id="water-moderado" />
            <Label htmlFor="water-moderado">Atividade moderada</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="intenso" id="water-intenso" />
            <Label htmlFor="water-intenso">Atividade intensa</Label>
          </div>
        </RadioGroup>
      </div>

      <Button
        onClick={() => setStep(2)}
        className="w-full bg-teal-700 hover:bg-teal-800"
        size="lg"
        disabled={!formData.weight || !formData.activityLevel}
      >
        Próximo
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label>Clima onde você vive</Label>
        <RadioGroup value={formData.climate} onValueChange={(v) => setFormData({ ...formData, climate: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="frio" id="frio" />
            <Label htmlFor="frio">Frio</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="temperado" id="temperado" />
            <Label htmlFor="temperado">Temperado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="quente" id="quente" />
            <Label htmlFor="quente">Quente</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>Quanto de água você bebe atualmente por dia? (litros)</Label>
        <Input
          type="number"
          step="0.1"
          value={formData.currentIntake}
          onChange={(e) => setFormData({ ...formData, currentIntake: e.target.value })}
          placeholder="2.0"
        />
      </div>

      <div>
        <Label>Como é sua rotina?</Label>
        <RadioGroup value={formData.routine} onValueChange={(v) => setFormData({ ...formData, routine: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="escritorio" id="escritorio" />
            <Label htmlFor="escritorio">Trabalho em escritório</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ativa" id="ativa" />
            <Label htmlFor="ativa">Rotina ativa</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="variada" id="variada" />
            <Label htmlFor="variada">Variada</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setStep(1)} variant="outline" className="flex-1" size="lg">
          Voltar
        </Button>
        <Button
          onClick={handleCalculate}
          className="flex-1 bg-teal-700 hover:bg-teal-800"
          size="lg"
          disabled={!formData.climate || !formData.currentIntake || !formData.routine}
        >
          Calcular
        </Button>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardDescription>Água Recomendada</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{result.recommendedWater}L</p>
            <p className="text-sm text-blue-600 mt-1">por dia</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardDescription>Consumo Atual</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-700">{result.currentIntake}L</p>
            <p className="text-sm text-gray-600 mt-1">por dia</p>
          </CardContent>
        </Card>
      </div>

      <Card className={`${parseFloat(result.difference) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
        <CardHeader>
          <CardTitle>Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{result.diagnosis}</p>
        </CardContent>
      </Card>

      <Button onClick={() => { setStep(1); setResult(null); }} variant="outline" className="w-full" size="lg">
        Fazer Novo Cálculo
      </Button>

      {userType === 'visitor' && <CTACard />}
    </div>
  );

  return (
    <Layout title="Calculadora de Água" showBack userType={userType}>
      <div data-testid="water-calculator" className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Calcule sua Necessidade de Água</CardTitle>
            <CardDescription>
              {!result ? `Passo ${step} de 2` : 'Seu resultado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && step === 1 && renderStep1()}
            {!result && step === 2 && renderStep2()}
            {result && renderResult()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WaterCalculator;
