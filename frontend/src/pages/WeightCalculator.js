import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ProjectCTA from '@/components/ProjectCTA';

const WeightCalculator = ({ userType = 'visitor' }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    age: '',
    gender: '',
    bodyPerception: '',
    goal: '',
    activityLevel: ''
  });
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const height = parseFloat(formData.height);
    const heightInMeters = height / 100;
    const imc = parseFloat(formData.weight) / (heightInMeters * heightInMeters);
    
    let idealWeight;
    if (formData.gender === 'masculino') {
      idealWeight = (height - 100) * 0.9;
    } else {
      idealWeight = (height - 100) * 0.85;
    }

    let diagnosis = '';
    if (imc < 18.5) {
      diagnosis = 'Você está abaixo do peso ideal. Recomendamos uma dieta balanceada para ganho de massa muscular.';
    } else if (imc < 25) {
      diagnosis = 'Parabéns! Você está no peso ideal. Continue mantendo hábitos saudáveis.';
    } else if (imc < 30) {
      diagnosis = 'Você está com sobrepeso. Um plano alimentar adequado pode ajudá-lo a atingir seu peso ideal.';
    } else {
      diagnosis = 'Você está em obesidade. É importante buscar acompanhamento profissional para um plano personalizado.';
    }

    setResult({
      idealWeight: idealWeight.toFixed(1),
      currentWeight: formData.weight,
      imc: imc.toFixed(1),
      difference: (parseFloat(formData.weight) - idealWeight).toFixed(1),
      diagnosis
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Altura (cm)</Label>
          <Input
            type="number"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="170"
          />
        </div>
        <div>
          <Label>Peso Atual (kg)</Label>
          <Input
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="70"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Idade</Label>
          <Input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="30"
          />
        </div>
        <div>
          <Label>Sexo</Label>
          <RadioGroup value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="masculino" id="masculino" />
              <Label htmlFor="masculino">Masculino</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="feminino" id="feminino" />
              <Label htmlFor="feminino">Feminino</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <Button
        onClick={() => setStep(2)}
        className="w-full bg-teal-700 hover:bg-teal-800"
        size="lg"
        disabled={!formData.height || !formData.weight || !formData.age || !formData.gender}
      >
        Próximo
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label>Como você se considera?</Label>
        <RadioGroup value={formData.bodyPerception} onValueChange={(v) => setFormData({ ...formData, bodyPerception: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="magro" id="magro" />
            <Label htmlFor="magro">Magro(a)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="normal" id="normal" />
            <Label htmlFor="normal">Peso normal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="acima" id="acima" />
            <Label htmlFor="acima">Acima do peso</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>Qual é seu objetivo?</Label>
        <RadioGroup value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="perder" id="perder" />
            <Label htmlFor="perder">Perder peso</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manter" id="manter" />
            <Label htmlFor="manter">Manter peso</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ganhar" id="ganhar" />
            <Label htmlFor="ganhar">Ganhar massa muscular</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>Nível de atividade física</Label>
        <RadioGroup value={formData.activityLevel} onValueChange={(v) => setFormData({ ...formData, activityLevel: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sedentario" id="sedentario" />
            <Label htmlFor="sedentario">Sedentário</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="leve" id="leve" />
            <Label htmlFor="leve">Atividade leve (1-3x/semana)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="moderado" id="moderado" />
            <Label htmlFor="moderado">Atividade moderada (3-5x/semana)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="intenso" id="intenso" />
            <Label htmlFor="intenso">Atividade intensa (5-7x/semana)</Label>
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
          disabled={!formData.bodyPerception || !formData.goal || !formData.activityLevel}
        >
          Calcular
        </Button>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader className="pb-3">
            <CardDescription>Peso Ideal</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-teal-700">{result.idealWeight} kg</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardDescription>Peso Atual</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-700">{result.currentWeight} kg</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardDescription>IMC</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-700">{result.imc}</p>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
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

      {/* CTA sempre aparece para visitantes */}
      {userType === 'visitor' && (
        <ProjectCTA 
          imc={result.imc} 
          calculatorType="peso"
        />
      )}
    </div>
  );

  return (
    <Layout title="Calculadora de Peso" showBack userType={userType}>
      <div data-testid="weight-calculator" className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Calcule seu Peso de Referência</CardTitle>
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

export default WeightCalculator;