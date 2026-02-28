/**
 * Smart Anamnesis - Sistema inteligente de análise de anamnese
 * Gera pré-plano alimentar e recomendações baseado nas respostas do paciente
 */

// Arrays de alimentos alternativos para criar variações (6 estilos diferentes)
const MEAL_VARIATIONS = {
  breakfast: [
    // Variação 1 - Clássico Brasileiro
    ['Aveia com frutas', 'Ovos mexidos', 'Pão integral', 'Café sem açúcar'],
    // Variação 2 - Prático e Rápido
    ['Tapioca com queijo branco', 'Vitamina de frutas com whey', 'Chá verde'],
    // Variação 3 - Proteico
    ['Omelete de claras com legumes', 'Pão de batata doce', 'Iogurte natural', 'Café'],
    // Variação 4 - Low Carb
    ['Ovos cozidos', 'Abacate', 'Queijo minas', 'Chá de ervas'],
    // Variação 5 - Mediterrâneo
    ['Pão sírio integral', 'Homus', 'Tomate cereja', 'Azeite', 'Chá de hortelã'],
    // Variação 6 - Fitness
    ['Panqueca de banana e aveia', 'Whey protein', 'Frutas vermelhas', 'Café']
  ],
  morning_snack: [
    ['Frutas frescas', 'Castanhas (porção pequena)'],
    ['Iogurte grego com granola', 'Água de coco'],
    ['Banana com pasta de amendoim'],
    ['Mix de oleaginosas', 'Maçã'],
    ['Iogurte natural com mel', 'Nozes'],
    ['Shake proteico', 'Frutas cítricas']
  ],
  lunch: [
    // Variação 1 - Clássico Brasileiro
    ['Arroz integral', 'Feijão', 'Frango grelhado', 'Salada de folhas', 'Azeite'],
    // Variação 2 - Prático
    ['Quinoa', 'Lentilha', 'Peixe assado', 'Legumes no vapor', 'Azeite'],
    // Variação 3 - Proteico
    ['Batata doce', 'Grão de bico', 'Carne magra', 'Salada colorida', 'Azeite'],
    // Variação 4 - Low Carb
    ['Couve-flor refogada', 'Feijão preto', 'Salmão grelhado', 'Brócolis', 'Azeite'],
    // Variação 5 - Mediterrâneo
    ['Cuscuz marroquino', 'Lentilha', 'Frango ao limão', 'Salada grega', 'Azeite extra virgem'],
    // Variação 6 - Fitness
    ['Arroz integral', 'Feijão branco', 'Peito de frango grelhado', 'Mix de vegetais', 'Azeite']
  ],
  afternoon_snack: [
    ['Iogurte natural', 'Frutas'],
    ['Sanduíche integral com peito de peru', 'Suco natural'],
    ['Crepioca com banana', 'Chá gelado'],
    ['Smoothie de frutas vermelhas', 'Torrada integral'],
    ['Húmus com palitos de cenoura', 'Água com limão'],
    ['Barra de proteína caseira', 'Café gelado sem açúcar']
  ],
  dinner: [
    ['Proteína magra (frango/peixe)', 'Legumes grelhados', 'Salada verde'],
    ['Omelete de legumes', 'Salada completa', 'Sopa de legumes'],
    ['Peixe ao forno', 'Purê de abóbora', 'Aspargos grelhados'],
    ['Frango desfiado', 'Abobrinha refogada', 'Salada com tomate'],
    ['Sardinha assada', 'Ratatouille', 'Pão integral torrado'],
    ['Tilápia grelhada', 'Batata doce assada', 'Salada de rúcula']
  ],
  supper: [
    ['Chá calmante', 'Frutas leves (maçã, pera)'],
    ['Leite morno', 'Biscoitos integrais'],
    ['Iogurte com mel', 'Camomila'],
    ['Queijo cottage com frutas secas'],
    ['Chá de erva-cidreira', 'Kiwi'],
    ['Leite vegetal morno', 'Castanha do Pará']
  ]
};

// Nomes dos estilos de variação
const VARIATION_NAMES = [
  'Clássico Brasileiro',
  'Prático e Rápido', 
  'Proteico',
  'Low Carb',
  'Mediterrâneo',
  'Fitness'
];

// ==================== PLANOS ESPECIAIS (BASEADOS EM CONDIÇÃO) ====================

/**
 * Configurações de planos especiais para condições médicas
 * Sistema modular para fácil adição de novos protocolos
 */
const SPECIAL_PLANS = {
  // 🩸 DIABÉTICO - Baixo índice glicêmico, controle de carboidratos
  diabetico: {
    id: 'diabetico',
    name: 'Diabético',
    icon: '🩸',
    category: 'special',
    description: 'Baixo índice glicêmico, controle de carboidratos',
    tags: ['diabetes', 'glicemia', 'insulina'],
    guidelines: [
      'Priorizar carboidratos complexos e de baixo IG',
      'Fracionar refeições (5-6x ao dia)',
      'Incluir fibras em todas as refeições',
      'Evitar açúcares simples e refinados',
      'Combinar carboidratos com proteínas/gorduras boas'
    ],
    meals: {
      breakfast: [
        ['Pão integral com abacate', 'Ovo cozido', 'Chá verde sem açúcar'],
        ['Aveia em flocos com canela', 'Iogurte natural', 'Nozes'],
        ['Tapioca com queijo branco', 'Omelete de claras', 'Café sem açúcar']
      ],
      morning_snack: [
        ['Maçã com casca', 'Castanhas (5 unidades)'],
        ['Iogurte natural sem açúcar', 'Sementes de chia'],
        ['Pera', 'Amêndoas (8 unidades)']
      ],
      lunch: [
        ['Arroz integral (porção controlada)', 'Feijão', 'Frango grelhado', 'Salada de folhas verdes', 'Azeite'],
        ['Quinoa', 'Lentilha', 'Peixe assado', 'Legumes no vapor', 'Azeite'],
        ['Batata doce (pequena porção)', 'Grão de bico', 'Carne magra', 'Brócolis', 'Azeite']
      ],
      afternoon_snack: [
        ['Cenoura baby', 'Homus caseiro'],
        ['Pepino com queijo cottage'],
        ['Tomate cereja', 'Queijo minas']
      ],
      dinner: [
        ['Frango grelhado', 'Abobrinha refogada', 'Salada verde'],
        ['Peixe ao forno', 'Couve-flor gratinada', 'Salada de folhas'],
        ['Omelete de legumes', 'Espinafre refogado', 'Tomate']
      ],
      supper: [
        ['Chá de camomila', 'Queijo cottage (2 col sopa)'],
        ['Leite desnatado morno', 'Canela'],
        ['Chá de ervas', 'Castanha do Pará (2 unidades)']
      ]
    },
    avoid: ['Açúcar refinado', 'Mel em excesso', 'Pão branco', 'Arroz branco', 'Sucos de caixa', 'Refrigerantes', 'Doces', 'Massas refinadas'],
    prefer: ['Fibras', 'Proteínas magras', 'Gorduras boas', 'Vegetais folhosos', 'Grãos integrais']
  },

  // ❤️ HIPERTENSO - Dieta DASH, baixo sódio
  hipertenso: {
    id: 'hipertenso',
    name: 'Hipertenso (DASH)',
    icon: '❤️',
    category: 'special',
    description: 'Baixo sódio, estratégia DASH para pressão arterial',
    tags: ['hipertensão', 'pressão alta', 'DASH', 'sódio'],
    guidelines: [
      'Reduzir sódio (máx 2g/dia)',
      'Aumentar potássio, magnésio e cálcio',
      'Priorizar frutas, vegetais e grãos integrais',
      'Limitar gorduras saturadas',
      'Evitar alimentos ultraprocessados'
    ],
    meals: {
      breakfast: [
        ['Aveia com banana', 'Leite desnatado', 'Mel (pouco)'],
        ['Pão integral sem sal', 'Queijo sem sal', 'Mamão', 'Chá'],
        ['Tapioca', 'Ovo mexido sem sal', 'Melão', 'Café']
      ],
      morning_snack: [
        ['Banana', 'Iogurte natural desnatado'],
        ['Laranja', 'Castanhas sem sal'],
        ['Mamão', 'Aveia']
      ],
      lunch: [
        ['Arroz integral', 'Feijão sem sal', 'Frango grelhado com ervas', 'Salada colorida', 'Azeite'],
        ['Quinoa', 'Lentilha', 'Peixe com limão', 'Legumes no vapor', 'Ervas frescas'],
        ['Batata doce assada', 'Grão de bico', 'Carne magra', 'Brócolis', 'Alho e cebola']
      ],
      afternoon_snack: [
        ['Melancia', 'Sementes de girassol sem sal'],
        ['Abacate (pequena porção)', 'Limão'],
        ['Salada de frutas natural']
      ],
      dinner: [
        ['Salmão grelhado', 'Espinafre refogado', 'Tomate', 'Azeite'],
        ['Frango desfiado', 'Abobrinha', 'Cenoura', 'Ervas'],
        ['Omelete de claras', 'Salada verde', 'Beterraba cozida']
      ],
      supper: [
        ['Chá de hibisco', 'Maçã'],
        ['Leite desnatado', 'Canela'],
        ['Água de coco natural', 'Kiwi']
      ]
    },
    avoid: ['Sal em excesso', 'Embutidos', 'Enlatados', 'Temperos prontos', 'Queijos amarelos', 'Fast food', 'Salgadinhos', 'Molho shoyu'],
    prefer: ['Ervas frescas', 'Limão', 'Alho', 'Cebola', 'Frutas ricas em potássio', 'Vegetais folhosos', 'Laticínios desnatados']
  },

  // 🚫 INTOLERÂNCIAS - Sem lactose e/ou sem glúten
  intolerancia: {
    id: 'intolerancia',
    name: 'Sem Lactose/Glúten',
    icon: '🚫',
    category: 'special',
    description: 'Opções sem lactose e sem glúten',
    tags: ['intolerância', 'lactose', 'glúten', 'celíaco'],
    guidelines: [
      'Substituir leite por versões vegetais ou sem lactose',
      'Usar farinhas sem glúten (arroz, amêndoa, coco)',
      'Verificar rótulos de produtos industrializados',
      'Preferir alimentos naturalmente sem glúten',
      'Garantir cálcio de outras fontes'
    ],
    meals: {
      breakfast: [
        ['Tapioca com ovo', 'Leite de amêndoas', 'Frutas'],
        ['Pão sem glúten', 'Pasta de amendoim', 'Banana', 'Café'],
        ['Cuscuz de milho', 'Ovo mexido', 'Mamão', 'Chá']
      ],
      morning_snack: [
        ['Frutas frescas', 'Castanhas'],
        ['Iogurte de coco', 'Granola sem glúten'],
        ['Banana', 'Pasta de amendoim']
      ],
      lunch: [
        ['Arroz', 'Feijão', 'Frango grelhado', 'Salada', 'Azeite'],
        ['Quinoa', 'Lentilha', 'Peixe assado', 'Legumes', 'Azeite'],
        ['Batata doce', 'Grão de bico', 'Carne magra', 'Brócolis']
      ],
      afternoon_snack: [
        ['Smoothie de frutas com leite de coco'],
        ['Chips de batata doce assada', 'Guacamole'],
        ['Frutas com coco ralado']
      ],
      dinner: [
        ['Peixe grelhado', 'Purê de abóbora', 'Salada verde'],
        ['Frango desfiado', 'Arroz', 'Legumes refogados'],
        ['Omelete de legumes', 'Salada completa']
      ],
      supper: [
        ['Chá de camomila', 'Frutas'],
        ['Leite de amêndoas morno', 'Canela'],
        ['Smoothie de banana com leite de coco']
      ]
    },
    avoid: ['Leite de vaca', 'Queijos comuns', 'Iogurte tradicional', 'Trigo', 'Centeio', 'Cevada', 'Aveia contaminada', 'Pães tradicionais', 'Massas de trigo'],
    prefer: ['Leites vegetais', 'Queijos sem lactose', 'Tapioca', 'Arroz', 'Milho', 'Quinoa', 'Frutas', 'Vegetais', 'Carnes naturais']
  },

  // 🤰 GESTANTE - Ácido fólico, ferro, fracionamento
  gestante: {
    id: 'gestante',
    name: 'Gestante',
    icon: '🤰',
    category: 'special',
    description: 'Rico em ácido fólico, ferro e nutrientes essenciais',
    tags: ['gravidez', 'gestação', 'pré-natal'],
    guidelines: [
      'Aumentar ácido fólico (vegetais verde-escuros)',
      'Garantir ferro adequado (carnes, leguminosas)',
      'Fracionar refeições (6x ao dia para evitar enjoos)',
      'Aumentar cálcio (ossos do bebê)',
      'Hidratação abundante'
    ],
    meals: {
      breakfast: [
        ['Aveia com frutas vermelhas', 'Ovo cozido', 'Suco de laranja natural'],
        ['Pão integral', 'Queijo branco', 'Mamão', 'Leite'],
        ['Tapioca com queijo', 'Vitamina de banana', 'Castanhas']
      ],
      morning_snack: [
        ['Iogurte natural', 'Granola', 'Mel'],
        ['Frutas variadas', 'Castanhas'],
        ['Sanduíche natural pequeno']
      ],
      lunch: [
        ['Arroz integral', 'Feijão', 'Bife de fígado acebolado', 'Espinafre refogado', 'Beterraba'],
        ['Quinoa', 'Lentilha', 'Frango grelhado', 'Brócolis', 'Cenoura'],
        ['Arroz', 'Feijão preto', 'Peixe assado', 'Couve refogada', 'Abóbora']
      ],
      afternoon_snack: [
        ['Vitamina de abacate com leite'],
        ['Pão integral', 'Pasta de grão de bico'],
        ['Frutas com iogurte']
      ],
      dinner: [
        ['Sopa de legumes com frango', 'Torrada integral'],
        ['Omelete de espinafre', 'Salada colorida', 'Arroz'],
        ['Peixe grelhado', 'Purê de batata', 'Legumes']
      ],
      supper: [
        ['Leite morno', 'Biscoito integral'],
        ['Iogurte com frutas'],
        ['Chá de erva-doce', 'Torrada']
      ]
    },
    avoid: ['Álcool', 'Cafeína em excesso', 'Peixes crus', 'Carnes mal passadas', 'Queijos não pasteurizados', 'Adoçantes artificiais'],
    prefer: ['Ácido fólico', 'Ferro', 'Cálcio', 'Ômega-3', 'Fibras', 'Proteínas de qualidade', 'Vitamina D']
  },

  // 🤱 LACTANTE - Maior densidade calórica, cálcio, ferro, hidratação
  lactante: {
    id: 'lactante',
    name: 'Lactante',
    icon: '🤱',
    category: 'special',
    description: 'Maior densidade calórica para produção de leite',
    tags: ['amamentação', 'lactação', 'pós-parto'],
    guidelines: [
      'Aumentar calorias (+500 kcal/dia)',
      'Garantir hidratação abundante (3L água/dia)',
      'Manter ferro e cálcio elevados',
      'Incluir gorduras boas para o leite',
      'Evitar alimentos que causem cólicas no bebê'
    ],
    meals: {
      breakfast: [
        ['Aveia com banana e mel', 'Ovos mexidos', 'Leite integral', 'Pão integral'],
        ['Panqueca de banana', 'Iogurte natural', 'Frutas', 'Castanhas'],
        ['Tapioca com queijo e ovo', 'Vitamina de mamão', 'Granola']
      ],
      morning_snack: [
        ['Mix de castanhas', 'Frutas', 'Água de coco'],
        ['Iogurte com granola', 'Banana'],
        ['Sanduíche natural', 'Suco natural']
      ],
      lunch: [
        ['Arroz integral', 'Feijão', 'Carne magra', 'Legumes variados', 'Salada', 'Azeite'],
        ['Macarrão integral', 'Molho de tomate caseiro', 'Frango desfiado', 'Salada'],
        ['Arroz', 'Lentilha', 'Peixe assado', 'Legumes', 'Abacate']
      ],
      afternoon_snack: [
        ['Vitamina de abacate com leite'],
        ['Pão com pasta de amendoim', 'Banana'],
        ['Smoothie de frutas com aveia']
      ],
      dinner: [
        ['Sopa cremosa de legumes', 'Frango desfiado', 'Torradas'],
        ['Risoto de legumes', 'Salada verde'],
        ['Peixe grelhado', 'Purê de batata', 'Legumes']
      ],
      supper: [
        ['Leite morno com mel', 'Biscoitos integrais'],
        ['Iogurte natural', 'Frutas', 'Granola'],
        ['Mingau de aveia']
      ]
    },
    avoid: ['Álcool', 'Cafeína em excesso', 'Alimentos muito condimentados', 'Chocolate em excesso', 'Refrigerantes'],
    prefer: ['Água', 'Leite', 'Proteínas', 'Carboidratos complexos', 'Gorduras boas', 'Frutas', 'Vegetais']
  },

  // 🩺 ANEMIA - Rico em ferro + vitamina C
  anemia: {
    id: 'anemia',
    name: 'Anemia (Rico em Ferro)',
    icon: '🩺',
    category: 'special',
    description: 'Rico em ferro com vitamina C para absorção',
    tags: ['anemia', 'ferro', 'hemoglobina'],
    guidelines: [
      'Priorizar ferro heme (carnes vermelhas)',
      'Combinar ferro não-heme com vitamina C',
      'Evitar café/chá junto às refeições',
      'Incluir vegetais verde-escuros',
      'Leguminosas em todas as refeições'
    ],
    meals: {
      breakfast: [
        ['Pão integral', 'Ovo cozido', 'Suco de laranja natural', 'Mamão'],
        ['Aveia com morango', 'Vitamina de acerola', 'Castanhas'],
        ['Tapioca', 'Omelete de espinafre', 'Suco de limão com água']
      ],
      morning_snack: [
        ['Acerola', 'Castanha de caju'],
        ['Laranja', 'Amêndoas'],
        ['Kiwi', 'Mix de oleaginosas']
      ],
      lunch: [
        ['Arroz', 'Feijão preto', 'Bife de fígado', 'Couve refogada', 'Beterraba', 'Limão'],
        ['Arroz integral', 'Lentilha', 'Carne vermelha magra', 'Espinafre', 'Tomate'],
        ['Quinoa', 'Feijão', 'Frango', 'Brócolis', 'Pimentão']
      ],
      afternoon_snack: [
        ['Suco verde (couve, laranja, limão)'],
        ['Salada de frutas cítricas'],
        ['Vitamina de beterraba com laranja']
      ],
      dinner: [
        ['Carne vermelha grelhada', 'Espinafre refogado', 'Arroz', 'Salada com tomate'],
        ['Fígado acebolado', 'Couve', 'Feijão', 'Arroz'],
        ['Peixe grelhado', 'Legumes verdes', 'Limão']
      ],
      supper: [
        ['Suco de acerola', 'Frutas'],
        ['Vitamina de morango'],
        ['Iogurte com frutas vermelhas']
      ]
    },
    avoid: ['Café junto às refeições', 'Chá preto/verde junto às refeições', 'Refrigerantes', 'Leite junto ao ferro'],
    prefer: ['Carnes vermelhas', 'Fígado', 'Leguminosas', 'Vegetais verde-escuros', 'Vitamina C', 'Beterraba', 'Frutas cítricas']
  }
};

// Lista ordenada dos planos especiais para exibição
const SPECIAL_PLANS_ORDER = ['diabetico', 'hipertenso', 'intolerancia', 'gestante', 'lactante', 'anemia'];

/**
 * Retorna configuração de um plano especial
 */
const getSpecialPlan = (planId) => SPECIAL_PLANS[planId] || null;

/**
 * Retorna todos os planos especiais disponíveis
 */
const getAllSpecialPlans = () => SPECIAL_PLANS_ORDER.map(id => SPECIAL_PLANS[id]);

/**
 * Gera refeições para um plano especial com variação
 */
const generateSpecialMeals = (planId, variationIndex = 0) => {
  const plan = SPECIAL_PLANS[planId];
  if (!plan) return null;

  const meals = [];
  const mealTypes = [
    { id: 'breakfast', name: 'Café da Manhã', time: '07:00', color: '#F59E0B' },
    { id: 'morning_snack', name: 'Lanche da Manhã', time: '10:00', color: '#10B981' },
    { id: 'lunch', name: 'Almoço', time: '12:30', color: '#EF4444' },
    { id: 'afternoon_snack', name: 'Lanche da Tarde', time: '15:30', color: '#8B5CF6' },
    { id: 'dinner', name: 'Jantar', time: '19:00', color: '#3B82F6' },
    { id: 'supper', name: 'Ceia', time: '21:00', color: '#6366F1' }
  ];

  mealTypes.forEach((mealType, idx) => {
    const mealOptions = plan.meals[mealType.id];
    if (mealOptions && mealOptions.length > 0) {
      // Seleciona variação baseada no índice
      const selectedVariation = mealOptions[variationIndex % mealOptions.length];
      meals.push({
        id: `${planId}_meal_${idx}`,
        name: mealType.name,
        time: mealType.time,
        color: mealType.color,
        foods: selectedVariation.map((food, foodIdx) => ({
          id: `${planId}_food_${idx}_${foodIdx}`,
          name: food,
          quantity: 1,
          unit: 'porção'
        }))
      });
    }
  });

  return meals;
};


/**
 * Gera um pré-plano alimentar inteligente baseado na anamnese
 * @param {Object} anamnesis - Dados da anamnese do paciente
 * @param {Object} patient - Dados do paciente (peso, altura, objetivo, etc)
 * @param {number} variation - Número da variação (1-6), default 1
 * @returns {Object} Pré-plano com refeições, alimentos indicados e a evitar
 */
export const generateSmartMealPlan = (anamnesis, patient, variation = 1) => {
  // Garantir que a variação está entre 1 e 6
  const varIndex = Math.max(0, Math.min(5, (variation - 1)));
  
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
    reasoning: '',
    variation: variation // Guardar qual variação foi usada
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
  
  // Preencher refeições com sugestões usando variação
  plan.meals = populateMeals(plan.meals, plan.recommendedFoods, goal, varIndex, restrictions);
  
  // Gerar raciocínio
  plan.reasoning = generateReasoning(conditions, goal, restrictions, variation);
  
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
 * Popula refeições com sugestões de alimentos baseadas na variação
 */
const populateMeals = (meals, recommendedFoods, goal, varIndex = 0, restrictions = { allergies: [], intolerances: [] }) => {
  // Função para filtrar alimentos com restrições
  const filterRestrictions = (foods) => {
    return foods.filter(food => {
      const foodLower = food.toLowerCase();
      const hasAllergy = restrictions.allergies?.some(a => foodLower.includes(a.toLowerCase()));
      const hasIntolerance = restrictions.intolerances?.some(i => foodLower.includes(i.toLowerCase()));
      return !hasAllergy && !hasIntolerance;
    });
  };

  // Café da Manhã
  meals[0].foods = filterRestrictions(MEAL_VARIATIONS.breakfast[varIndex] || MEAL_VARIATIONS.breakfast[0]);
  
  // Lanche Manhã
  meals[1].foods = filterRestrictions(MEAL_VARIATIONS.morning_snack[varIndex] || MEAL_VARIATIONS.morning_snack[0]);
  
  // Almoço
  meals[2].foods = filterRestrictions(MEAL_VARIATIONS.lunch[varIndex] || MEAL_VARIATIONS.lunch[0]);
  
  // Lanche Tarde
  meals[3].foods = filterRestrictions(MEAL_VARIATIONS.afternoon_snack[varIndex] || MEAL_VARIATIONS.afternoon_snack[0]);
  
  // Jantar
  meals[4].foods = filterRestrictions(MEAL_VARIATIONS.dinner[varIndex] || MEAL_VARIATIONS.dinner[0]);
  
  // Ceia
  meals[5].foods = filterRestrictions(MEAL_VARIATIONS.supper[varIndex] || MEAL_VARIATIONS.supper[0]);

  // Ajustes baseados no objetivo
  if (goal.type === 'weight_loss' || goal.needsWeightLoss) {
    // Reduzir carboidratos, aumentar proteína
    meals[0].foods = filterRestrictions(['Ovos mexidos', 'Queijo branco', 'Café sem açúcar', 'Frutas low carb']);
    meals[5].foods = filterRestrictions(['Chá calmante']); // Ceia mais leve
  }
  
  if (goal.type === 'muscle_gain' || goal.isAthlete) {
    // Aumentar proteína
    meals[0].foods.push('Whey protein');
    meals[3].foods = filterRestrictions(['Shake proteico', 'Banana com pasta de amendoim', 'Batata doce']);
  }
  
  return meals;
};

/**
 * Gera raciocínio/explicação do plano
 */
const generateReasoning = (conditions, goal, restrictions, variation = 1) => {
  let reasoning = `Este pré-plano foi gerado automaticamente com base na anamnese do paciente.\n\n`;
  reasoning += `**Estilo do plano:** ${VARIATION_NAMES[variation - 1] || 'Clássico Brasileiro'}\n`;
  
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
  reasoning += `\n\n💡 **Dica:** Use os botões de alternativas para ver outras opções de cardápio!`;
  
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

/**
 * Gera uma dica personalizada especial baseada na anamnese
 * Esta dica é única para cada paciente e fica destacada no painel
 */
const generatePersonalizedTip = (anamnesis, patient, conditions, goal) => {
  const name = patient?.full_name?.split(' ')[0] || 'Paciente';
  const goalType = goal?.type || 'health';
  
  // Templates de mensagens motivacionais por objetivo
  const motivationalTemplates = {
    weight_loss: [
      `${name}, você está dando o primeiro passo para uma transformação incrível! 🌟 Lembre-se: cada escolha saudável é uma vitória. Seu corpo vai agradecer por cada gole de água, cada legume no prato, cada noite bem dormida.`,
      `Olá ${name}! 💪 Sua jornada de emagrecimento começa agora, mas não se trata de perder peso - é sobre ganhar saúde, energia e autoconfiança. Confie no processo!`,
      `${name}, você decidiu cuidar de si e isso é admirável! 🎯 O segredo não está em dietas restritivas, mas em criar hábitos sustentáveis. Estamos juntos nessa!`
    ],
    muscle_gain: [
      `${name}, músculos são construídos com consistência e paciência! 💪 Cada treino conta, cada refeição importa. Seu corpo está pronto para essa transformação!`,
      `Foco no objetivo, ${name}! 🏋️ Ganhar massa muscular é um processo que exige dedicação, mas os resultados valem cada esforço. Acredite no seu potencial!`,
      `${name}, seu corpo é uma máquina incrível! 🔥 Com a nutrição certa e treino consistente, você vai alcançar resultados que nem imagina. Vamos juntos!`
    ],
    performance: [
      `${name}, atletas de elite são feitos nos detalhes! 🏆 Sua alimentação é seu combustível - cuide dela como cuida do seu treino!`,
      `Alta performance começa na cozinha, ${name}! ⚡ Cada nutriente vai te ajudar a ir mais longe, mais rápido, mais forte!`,
      `${name}, seu corpo é seu instrumento de alta performance! 🎯 Trate-o com o respeito que ele merece e ele vai te levar ao pódio!`
    ],
    health: [
      `${name}, saúde é o maior tesouro que podemos ter! 💚 Cuidar do corpo é um ato de amor próprio. Cada escolha saudável é um investimento no seu futuro!`,
      `Bem-estar começa de dentro para fora, ${name}! 🌱 Sua decisão de cuidar da saúde vai transformar não só seu corpo, mas sua qualidade de vida!`,
      `${name}, você está no caminho certo! ✨ Buscar saúde e equilíbrio é a melhor decisão que você pode tomar. Estou aqui para te guiar!`
    ],
    maintenance: [
      `${name}, manter uma alimentação equilibrada é uma conquista diária! 🎯 Você já fez muito por você - agora é hora de sustentar essas vitórias!`,
      `Parabéns por buscar equilíbrio, ${name}! ⚖️ Manutenção não é monotonia - é sabedoria em saber o que funciona para você!`,
      `${name}, você entendeu que saúde é um estilo de vida! 🌟 Manter bons hábitos é tão importante quanto criá-los. Continue firme!`
    ]
  };

  // Adicionar informações específicas baseadas nas condições
  let specificAdvice = '';
  
  if (conditions.includes('diabetes')) {
    specificAdvice = ' Lembre-se de manter os horários das refeições regulares para ajudar no controle glicêmico. 🕐';
  } else if (conditions.includes('hipertensao')) {
    specificAdvice = ' Diminuir o sal não significa perder sabor - ervas e especiarias são seus novos melhores amigos! 🌿';
  } else if (conditions.includes('ansiedade') || conditions.includes('estresse')) {
    specificAdvice = ' Sua alimentação pode ajudar a acalmar a mente - alimentos ricos em magnésio e ômega-3 são aliados poderosos! 🧘';
  } else if (conditions.includes('insonia')) {
    specificAdvice = ' Uma ceia leve com alimentos ricos em triptofano pode ser a chave para noites mais tranquilas! 🌙';
  } else if (conditions.includes('constipacao')) {
    specificAdvice = ' Fibras + água = intestino feliz! Essa dupla vai transformar seu bem-estar. 💧';
  }

  // Selecionar template aleatório baseado no objetivo
  const templates = motivationalTemplates[goalType] || motivationalTemplates.health;
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

  return {
    title: `✨ Mensagem Especial para ${name}`,
    content: randomTemplate + specificAdvice,
    isPersonalized: true,
    category: 'personalized',
    createdAt: new Date().toISOString()
  };
};

// Exportar funções e configurações
export { 
  SPECIAL_PLANS, 
  SPECIAL_PLANS_ORDER, 
  getSpecialPlan, 
  getAllSpecialPlans, 
  generateSpecialMeals,
  VARIATION_NAMES
};

export default generateSmartMealPlan;
