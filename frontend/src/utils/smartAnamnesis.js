/**
 * Smart Anamnesis - Sistema inteligente de análise de anamnese
 * Gera pré-plano alimentar e recomendações baseado nas respostas do paciente
 */

/**
 * Gera um pré-plano alimentar inteligente baseado na anamnese
 * @param {Object} anamnesis - Dados da anamnese do paciente
 * @param {Object} patient - Dados do paciente (peso, altura, objetivo, etc)
 * @returns {Object} Pré-plano com refeições, alimentos indicados e a evitar
 */
export const generateSmartMealPlan = (anamnesis, patient) => {
  const plan = {
    meals: [
      { id: 1, name: 'Café da Manhã', time: '07:00', foods: [], editable: true },
      { id: 2, name: 'Lanche da Manhã', time: '10:00', foods: [], editable: true },
      { id: 3, name: 'Almoço', time: '12:30', foods: [], editable: true },
      { id: 4, name: 'Lanche da Tarde', time: '15:30', foods: [], editable: true },
      { id: 5, name: 'Jantar', time: '19:00', foods: [], editable: true },
      { id: 6, name: 'Ceia', time: '21:30', foods: [], editable: true }
    ],
    recommendedFoods: [],
    foodsToAvoid: [],
    tips: [],
    reasoning: ''
  };

  // Análise de condições médicas
  const conditions = analyzeConditions(anamnesis);
  
  // Análise de objetivo (peso, ganho muscular, etc)
  const goal = analyzeGoal(patient);
  
  // Análise de alergias e intolerâncias
  const restrictions = analyzeRestrictions(anamnesis);
  
  // Gerar recomendações de alimentos
  plan.recommendedFoods = generateRecommendedFoods(conditions, goal, restrictions);
  
  // Gerar lista de alimentos a evitar
  plan.foodsToAvoid = generateFoodsToAvoid(conditions, restrictions);
  
  // Gerar dicas automáticas
  plan.tips = generateTips(conditions, goal, restrictions, plan.foodsToAvoid);
  
  // Gerar dica personalizada especial (criativa e motivacional)
  plan.personalizedTip = generatePersonalizedTip(anamnesis, patient, conditions, goal);
  
  // Preencher refeições com sugestões
  plan.meals = populateMeals(plan.meals, plan.recommendedFoods, goal);
  
  // Gerar raciocínio
  plan.reasoning = generateReasoning(conditions, goal, restrictions);
  
  return plan;
};

/**
 * Analisa condições médicas da anamnese
 */
const analyzeConditions = (anamnesis) => {
  const conditions = [];
  
  if (!anamnesis) return conditions;
  
  // Suporte ao novo formato (array) e ao antigo (texto)
  const medicalConditions = anamnesis.medical_conditions || [];
  const medicalConditionsText = anamnesis.medical_conditions_text || '';
  
  // Se for array, usar diretamente
  const conditionsToCheck = Array.isArray(medicalConditions) 
    ? medicalConditions.map(c => c.toLowerCase()).join(' ')
    : medicalConditionsText.toLowerCase();
  
  // Diabetes
  if (conditionsToCheck.includes('diabetes')) {
    conditions.push('diabetes');
  }
  
  // Hipertensão
  if (conditionsToCheck.includes('hipertens') || conditionsToCheck.includes('pressão')) {
    conditions.push('hypertension');
  }
  
  // Colesterol alto
  if (conditionsToCheck.includes('colesterol')) {
    conditions.push('high_cholesterol');
  }
  
  // Problemas intestinais
  if (conditionsToCheck.includes('intestin') || conditionsToCheck.includes('constipa') || 
      conditionsToCheck.includes('gastrite') || conditionsToCheck.includes('refluxo')) {
    conditions.push('intestinal_issues');
  }
  
  // Ansiedade/Estresse
  if (anamnesis.stress_level === 'high' || anamnesis.stress_level === 'very_high' ||
      conditionsToCheck.includes('ansiedade') || conditionsToCheck.includes('depressão')) {
    conditions.push('anxiety');
  }
  
  // Obesidade
  if (conditionsToCheck.includes('obesidade')) {
    conditions.push('obesity');
  }
  
  return conditions;
};

/**
 * Analisa objetivo do paciente
 */
const analyzeGoal = (patient) => {
  if (!patient) return { type: 'maintenance', needsWeightLoss: false, needsWeightGain: false };
  
  // Priorizar objetivo esportivo se disponível
  const sportsGoal = patient.sports_goal || patient.goal;
  const imc = calculateIMC(patient);
  
  return {
    type: sportsGoal || 'maintenance',
    imc: imc,
    needsWeightLoss: imc > 25,
    needsWeightGain: imc < 18.5,
    targetWeight: patient.goal_weight || patient.current_weight,
    isAthlete: patient.training_experience === 'athlete' || patient.training_experience === 'advanced'
  };
};

/**
 * Calcula IMC
 */
const calculateIMC = (patient) => {
  if (!patient?.height || !patient?.current_weight) return null;
  const heightInMeters = patient.height / 100;
  return (patient.current_weight / (heightInMeters * heightInMeters)).toFixed(1);
};

/**
 * Analisa restrições alimentares
 */
const analyzeRestrictions = (anamnesis) => {
  return {
    allergies: anamnesis?.allergies || [],
    intolerances: anamnesis?.food_intolerances || []
  };
};

/**
 * Gera lista de alimentos recomendados
 */
const generateRecommendedFoods = (conditions, goal, restrictions) => {
  const foods = [];
  
  // Base saudável para todos
  const baseFoods = [
    'Aveia',
    'Batata-doce',
    'Arroz integral',
    'Frango grelhado',
    'Peito de peru',
    'Ovos',
    'Legumes (brócolis, cenoura, abobrinha)',
    'Folhas verdes (alface, rúcula, espinafre)',
    'Frutas frescas (banana, maçã, morango)',
    'Azeite de oliva',
    'Castanhas e amêndoas'
  ];
  
  foods.push(...baseFoods);
  
  // Para diabetes
  if (conditions.includes('diabetes')) {
    foods.push('Quinoa', 'Aveia', 'Feijão', 'Lentilha', 'Canela', 'Chia');
  }
  
  // Para hipertensão
  if (conditions.includes('hypertension')) {
    foods.push('Banana', 'Beterraba', 'Alho', 'Salsão', 'Melancia', 'Abacate');
  }
  
  // Para colesterol
  if (conditions.includes('high_cholesterol')) {
    foods.push('Aveia', 'Peixes (salmão, sardinha)', 'Nozes', 'Linhaça', 'Berinjela');
  }
  
  // Para intestino
  if (conditions.includes('intestinal_issues')) {
    foods.push('Mamão', 'Iogurte natural', 'Kefir', 'Linhaça', 'Ameixa');
  }
  
  // Para ansiedade
  if (conditions.includes('anxiety')) {
    foods.push('Banana', 'Cacau', 'Chá de camomila', 'Salmão', 'Nozes');
  }
  
  // OBJETIVOS ESPORTIVOS ESPECÍFICOS
  
  // Para emagrecimento
  if (goal.type === 'weight_loss' || goal.needsWeightLoss) {
    foods.push(
      'Chá verde',
      'Pimenta',
      'Gengibre',
      'Vegetais low carb',
      'Proteínas magras',
      'Chia (saciedade)'
    );
  }
  
  // Para ganho de massa muscular
  if (goal.type === 'muscle_gain' || goal.isAthlete) {
    foods.push(
      'Whey protein',
      'Frango (alta proteína)',
      'Carne vermelha magra',
      'Batata doce',
      'Arroz branco (pós-treino)',
      'Banana com pasta de amendoim',
      'Ovos inteiros',
      'Queijo cottage',
      'Iogurte grego',
      'Creatina',
      'BCAA',
      'Tapioca (carboidrato rápido)'
    );
  }
  
  // Para performance esportiva
  if (goal.type === 'performance' || goal.isAthlete) {
    foods.push(
      'Beterraba (óxido nítrico)',
      'Café (pré-treino)',
      'Carboidratos complexos',
      'Proteínas de rápida absorção',
      'Taurina',
      'Bebidas isotônicas',
      'Mel (energia rápida)'
    );
  }
  
  // Para ganho de peso saudável
  if (goal.needsWeightGain) {
    foods.push('Abacate', 'Pasta de amendoim', 'Granola', 'Frutas secas', 'Oleaginosas', 'Tapioca');
  }
  
  // Remover alimentos com alergias/intolerâncias
  return foods.filter(food => {
    const foodLower = food.toLowerCase();
    return !restrictions.allergies.some(a => foodLower.includes(a.toLowerCase())) &&
           !restrictions.intolerances.some(i => foodLower.includes(i.toLowerCase()));
  });
};

/**
 * Gera lista de alimentos a evitar
 */
const generateFoodsToAvoid = (conditions, restrictions) => {
  const avoid = [];
  
  // Alergias e intolerâncias
  avoid.push(...restrictions.allergies.map(a => ({ food: a, reason: 'Alergia' })));
  avoid.push(...restrictions.intolerances.map(i => ({ food: i, reason: 'Intolerância' })));
  
  // Para diabetes
  if (conditions.includes('diabetes')) {
    avoid.push(
      { food: 'Açúcar refinado', reason: 'Aumenta glicemia rapidamente' },
      { food: 'Refrigerantes', reason: 'Alto índice glicêmico' },
      { food: 'Doces e sobremesas', reason: 'Pico de insulina' },
      { food: 'Pão branco', reason: 'Carboidrato de rápida absorção' }
    );
  }
  
  // Para hipertensão
  if (conditions.includes('hypertension')) {
    avoid.push(
      { food: 'Sal em excesso', reason: 'Aumenta pressão arterial' },
      { food: 'Alimentos industrializados', reason: 'Alto teor de sódio' },
      { food: 'Embutidos (salsicha, presunto)', reason: 'Muito sódio e conservantes' },
      { food: 'Temperos prontos', reason: 'Excesso de sódio' }
    );
  }
  
  // Para colesterol
  if (conditions.includes('high_cholesterol')) {
    avoid.push(
      { food: 'Frituras', reason: 'Gordura trans' },
      { food: 'Carnes gordurosas', reason: 'Gordura saturada' },
      { food: 'Manteiga', reason: 'Colesterol e gordura saturada' },
      { food: 'Fast food', reason: 'Gordura trans e saturada' }
    );
  }
  
  // Base geral saudável
  avoid.push(
    { food: 'Refrigerantes', reason: 'Açúcar e químicos' },
    { food: 'Alimentos ultraprocessados', reason: 'Aditivos e conservantes' },
    { food: 'Frituras', reason: 'Gordura trans' }
  );
  
  return avoid;
};

/**
 * Gera dicas automáticas
 */
const generateTips = (conditions, goal, restrictions, foodsToAvoid) => {
  const tips = [];
  
  // Dicas de hidratação
  tips.push({
    title: '💧 Hidratação',
    content: 'Beba ao menos 2 litros de água por dia. Comece o dia com 1 copo de água em jejum.'
  });
  
  // Dicas baseadas em condições
  if (conditions.includes('diabetes')) {
    tips.push({
      title: '🩸 Controle da Glicemia',
      content: 'Faça refeições regulares a cada 3 horas. Prefira carboidratos integrais e combine com proteína.'
    });
  }
  
  if (conditions.includes('hypertension')) {
    tips.push({
      title: '❤️ Controle da Pressão',
      content: 'Reduza o sal. Use temperos naturais como alho, cebola, ervas. Evite alimentos industrializados.'
    });
  }
  
  if (conditions.includes('high_cholesterol')) {
    tips.push({
      title: '🥗 Saúde do Coração',
      content: 'Prefira carnes magras e peixes. Evite frituras. Consuma mais fibras (aveia, legumes).'
    });
  }
  
  // DICAS BASEADAS EM OBJETIVOS ESPORTIVOS
  
  if (goal.type === 'weight_loss' || goal.needsWeightLoss) {
    tips.push({
      title: '🔥 Emagrecimento Saudável',
      content: 'Coma devagar e mastigue bem. Evite comer assistindo TV. Priorize vegetais no prato. Faça cardio 3-5x por semana.'
    });
    tips.push({
      title: '⚖️ Déficit Calórico',
      content: 'Para emagrecer, consuma menos calorias do que gasta. Mas não faça dietas muito restritivas - o ideal é perder 0,5-1kg por semana.'
    });
  }
  
  if (goal.type === 'muscle_gain') {
    tips.push({
      title: '💪 Ganho de Massa Muscular',
      content: 'Consuma 1,6-2,2g de proteína por kg de peso corporal. Faça refeições a cada 3-4 horas. Priorize treino de força.'
    });
    tips.push({
      title: '🍗 Proteína Pós-Treino',
      content: 'Consuma proteína de rápida absorção (whey) + carboidrato até 30min após o treino. Isso maximiza a síntese proteica.'
    });
    tips.push({
      title: '🍚 Carboidratos Estratégicos',
      content: 'Consuma mais carboidratos nos dias de treino. Batata-doce, arroz branco e tapioca são ótimas opções pós-treino.'
    });
  }
  
  if (goal.type === 'performance' || goal.isAthlete) {
    tips.push({
      title: '⚡ Performance Esportiva',
      content: 'Timing nutricional é crucial. Carboidratos antes do treino (energia), proteína após (recuperação). Hidrate-se constantemente.'
    });
    tips.push({
      title: '⏰ Janela Anabólica',
      content: 'Consuma carboidrato + proteína até 2h após o treino. Isso otimiza recuperação e ganho de performance.'
    });
  }
  
  if (goal.type === 'maintenance') {
    tips.push({
      title: '⚖️ Manutenção Saudável',
      content: 'Mantenha uma alimentação equilibrada com todos os grupos alimentares. Pratique atividade física regular.'
    });
  }
  
  if (goal.needsWeightGain) {
    tips.push({
      title: '📈 Ganho de Peso Saudável',
      content: 'Aumente a frequência das refeições. Inclua alimentos calóricos saudáveis como abacate, oleaginosas, pastas de amendoim.'
    });
  }
  
  // Dicas de alimentos a evitar (primeiros 3)
  const topAvoid = foodsToAvoid.slice(0, 3);
  if (topAvoid.length > 0) {
    tips.push({
      title: '🚫 Alimentos a Evitar',
      content: topAvoid.map(f => `• ${f.food}: ${f.reason}`).join('\n')
    });
  }
  
  return tips;
};

/**
 * Popula refeições com sugestões de alimentos
 */
const populateMeals = (meals, recommendedFoods, goal) => {
  // Café da Manhã
  meals[0].foods = [
    'Aveia com frutas',
    'Ovos mexidos',
    'Pão integral',
    'Café sem açúcar'
  ];
  
  // Lanche Manhã
  meals[1].foods = [
    'Frutas frescas',
    'Castanhas (porção pequena)'
  ];
  
  // Almoço
  meals[2].foods = [
    'Arroz integral',
    'Feijão',
    'Frango grelhado ou peixe',
    'Salada de folhas e legumes',
    'Azeite de oliva'
  ];
  
  // Lanche Tarde
  meals[3].foods = [
    'Iogurte natural',
    'Frutas'
  ];
  
  // Jantar
  meals[4].foods = [
    'Proteína magra (frango/peixe)',
    'Legumes grelhados',
    'Salada verde'
  ];
  
  // Ceia
  meals[5].foods = [
    'Chá calmante',
    'Frutas leves (maçã, pera)'
  ];
  
  return meals;
};

/**
 * Gera raciocínio/explicação do plano
 */
const generateReasoning = (conditions, goal, restrictions) => {
  let reasoning = 'Este pré-plano foi gerado automaticamente com base na anamnese do paciente.\n\n';
  
  if (conditions.length > 0) {
    reasoning += `**Condições identificadas:** ${conditions.join(', ')}\n`;
  }
  
  if (goal.type) {
    reasoning += `**Objetivo:** ${translateGoal(goal.type)}\n`;
  }
  
  if (restrictions.allergies.length > 0) {
    reasoning += `**Alergias:** ${restrictions.allergies.join(', ')}\n`;
  }
  
  if (restrictions.intolerances.length > 0) {
    reasoning += `**Intolerâncias:** ${restrictions.intolerances.join(', ')}\n`;
  }
  
  reasoning += '\n⚠️ **Importante:** Este é apenas um rascunho inicial. Revise e ajuste conforme necessário para o paciente.';
  
  return reasoning;
};

/**
 * Traduz objetivo
 */
const translateGoal = (goal) => {
  const goals = {
    'weight_loss': 'Emagrecimento',
    'muscle_gain': 'Ganho de Massa Muscular',
    'maintenance': 'Manutenção',
    'health': 'Saúde e Bem-estar',
    'performance': 'Performance Esportiva'
  };
  return goals[goal] || goal;
};

export default generateSmartMealPlan;
