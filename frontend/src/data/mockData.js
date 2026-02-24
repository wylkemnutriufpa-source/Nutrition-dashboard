export const mockFoods = [
  { id: 1, name: 'Arroz branco cozido', source: 'TACO', source_id: 'taco_001', calorias: 128, proteina: 2.5, carboidrato: 28.1, gordura: 0.2, fibra: 1.6, sodio: 1, porcao: 100, unidade: 'g' },
  { id: 2, name: 'Feijão preto cozido', source: 'TACO', source_id: 'taco_002', calorias: 77, proteina: 4.5, carboidrato: 14, gordura: 0.5, fibra: 8.4, sodio: 2, porcao: 100, unidade: 'g' },
  { id: 3, name: 'Peito de frango grelhado', source: 'TACO', source_id: 'taco_003', calorias: 165, proteina: 31, carboidrato: 0, gordura: 3.6, fibra: 0, sodio: 70, porcao: 100, unidade: 'g' },
  { id: 4, name: 'Ovo cozido', source: 'TACO', source_id: 'taco_004', calorias: 155, proteina: 13, carboidrato: 1.1, gordura: 11, fibra: 0, sodio: 124, porcao: 50, unidade: 'unidade' },
  { id: 5, name: 'Banana', source: 'TACO', source_id: 'taco_005', calorias: 89, proteina: 1.1, carboidrato: 23, gordura: 0.3, fibra: 2.6, sodio: 1, porcao: 100, unidade: 'unidade' },
  { id: 6, name: 'Batata doce cozida', source: 'TACO', source_id: 'taco_006', calorias: 77, proteina: 0.6, carboidrato: 18.4, gordura: 0.1, fibra: 2.2, sodio: 9, porcao: 100, unidade: 'g' },
  { id: 7, name: 'Brócolis cozido', source: 'TACO', source_id: 'taco_007', calorias: 25, proteina: 1.9, carboidrato: 4.5, gordura: 0.2, fibra: 3.4, sodio: 8, porcao: 100, unidade: 'g' },
  { id: 8, name: 'Azeite de oliva', source: 'TACO', source_id: 'taco_008', calorias: 884, proteina: 0, carboidrato: 0, gordura: 100, fibra: 0, sodio: 0, porcao: 10, unidade: 'ml' },
  { id: 9, name: 'Aveia em flocos', source: 'TACO', source_id: 'taco_009', calorias: 394, proteina: 13.9, carboidrato: 66.6, gordura: 8.5, fibra: 9.1, sodio: 5, porcao: 50, unidade: 'g' },
  { id: 10, name: 'Leite desnatado', source: 'TACO', source_id: 'taco_010', calorias: 35, proteina: 3.4, carboidrato: 4.9, gordura: 0.1, fibra: 0, sodio: 50, porcao: 200, unidade: 'ml' },
  { id: 11, name: 'Queijo minas frescal', source: 'TACO', source_id: 'taco_011', calorias: 264, proteina: 17.4, carboidrato: 3.1, gordura: 20.8, fibra: 0, sodio: 215, porcao: 50, unidade: 'g' },
  { id: 12, name: 'Maçã', source: 'TACO', source_id: 'taco_012', calorias: 52, proteina: 0.3, carboidrato: 14, gordura: 0.2, fibra: 2.4, sodio: 1, porcao: 130, unidade: 'unidade' },
  { id: 13, name: 'Pão integral', source: 'TACO', source_id: 'taco_013', calorias: 253, proteina: 9, carboidrato: 49, gordura: 3.5, fibra: 6.9, sodio: 400, porcao: 50, unidade: 'fatia' },
  { id: 14, name: 'Tomate', source: 'TACO', source_id: 'taco_014', calorias: 18, proteina: 0.9, carboidrato: 3.9, gordura: 0.2, fibra: 1.2, sodio: 5, porcao: 100, unidade: 'g' },
  { id: 15, name: 'Alface', source: 'TACO', source_id: 'taco_015', calorias: 14, proteina: 1.4, carboidrato: 2.9, gordura: 0.2, fibra: 2.1, sodio: 8, porcao: 100, unidade: 'g' },
  { id: 16, name: 'Filé de tilápia', source: 'TACO', source_id: 'taco_016', calorias: 96, proteina: 20, carboidrato: 0, gordura: 1.5, fibra: 0, sodio: 52, porcao: 100, unidade: 'g' },
  { id: 17, name: 'Castanha do Pará', source: 'TACO', source_id: 'taco_017', calorias: 656, proteina: 14, carboidrato: 12, gordura: 63, fibra: 7.5, sodio: 3, porcao: 10, unidade: 'g' },
  { id: 18, name: 'Iogurte natural', source: 'USDA', source_id: 'usda_001', calorias: 61, proteina: 3.5, carboidrato: 4.7, gordura: 3.3, fibra: 0, sodio: 46, porcao: 150, unidade: 'ml' },
  { id: 19, name: 'Whey Protein', source: 'CUSTOM', source_id: null, calorias: 120, proteina: 24, carboidrato: 3, gordura: 1.5, fibra: 0, sodio: 100, porcao: 30, unidade: 'g', observacoes: 'Suplemento proteico' },
  { id: 20, name: 'Carne moída (patinho)', source: 'TACO', source_id: 'taco_020', calorias: 137, proteina: 21, carboidrato: 0, gordura: 5.5, fibra: 0, sodio: 59, porcao: 100, unidade: 'g' }
];

// Helper functions para gerenciar alimentos customizados
export const getCustomFoods = () => {
  const stored = localStorage.getItem('fitjourney_custom_foods');
  return stored ? JSON.parse(stored) : [];
};

export const saveCustomFood = (food) => {
  const customFoods = getCustomFoods();
  const newFood = {
    ...food,
    id: Date.now(),
    source: 'CUSTOM',
    source_id: null,
    created_at: new Date().toISOString()
  };
  customFoods.push(newFood);
  localStorage.setItem('fitjourney_custom_foods', JSON.stringify(customFoods));
  return newFood;
};

export const updateCustomFood = (id, updates) => {
  const customFoods = getCustomFoods();
  const index = customFoods.findIndex(f => f.id === id);
  if (index !== -1) {
    customFoods[index] = { ...customFoods[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem('fitjourney_custom_foods', JSON.stringify(customFoods));
    return customFoods[index];
  }
  return null;
};

export const deleteCustomFood = (id) => {
  const customFoods = getCustomFoods();
  const filtered = customFoods.filter(f => f.id !== id);
  localStorage.setItem('fitjourney_custom_foods', JSON.stringify(filtered));
  return true;
};

export const getAllFoods = () => {
  return [...mockFoods, ...getCustomFoods()];
};

export const mockMeals = [
  { id: 'm1', name: 'Café da Manhã', time: '07:00', color: '#F59E0B' },
  { id: 'm2', name: 'Lanche da Manhã', time: '10:00', color: '#10B981' },
  { id: 'm3', name: 'Almoço', time: '12:30', color: '#3B82F6' },
  { id: 'm4', name: 'Lanche da Tarde', time: '15:30', color: '#8B5CF6' },
  { id: 'm5', name: 'Jantar', time: '19:00', color: '#EF4444' },
  { id: 'm6', name: 'Ceia', time: '21:30', color: '#6366F1' }
];

export const mockPatients = [
  { id: 1, name: 'Ana Paula Silva', email: 'ana.silva@email.com', phone: '(11) 98765-4321', age: 28, status: 'Ativo', lastVisit: '2024-01-15', avatar: 'https://ui-avatars.com/api/?name=Ana+Paula+Silva&background=0F766E&color=fff' },
  { id: 2, name: 'Carlos Mendes', email: 'carlos.m@email.com', phone: '(11) 97654-3210', age: 35, status: 'Ativo', lastVisit: '2024-01-12', avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendes&background=0F766E&color=fff' },
  { id: 3, name: 'Mariana Costa', email: 'mari.costa@email.com', phone: '(21) 96543-2109', age: 42, status: 'Ativo', lastVisit: '2024-01-10', avatar: 'https://ui-avatars.com/api/?name=Mariana+Costa&background=0F766E&color=fff' },
  { id: 4, name: 'Pedro Oliveira', email: 'pedro.oli@email.com', phone: '(11) 95432-1098', age: 31, status: 'Inativo', lastVisit: '2023-12-20', avatar: 'https://ui-avatars.com/api/?name=Pedro+Oliveira&background=64748B&color=fff' },
  { id: 5, name: 'Juliana Santos', email: 'ju.santos@email.com', phone: '(85) 94321-0987', age: 26, status: 'Ativo', lastVisit: '2024-01-14', avatar: 'https://ui-avatars.com/api/?name=Juliana+Santos&background=0F766E&color=fff' },
  { id: 6, name: 'Roberto Alves', email: 'roberto.a@email.com', phone: '(11) 93210-9876', age: 38, status: 'Ativo', lastVisit: '2024-01-11', avatar: 'https://ui-avatars.com/api/?name=Roberto+Alves&background=0F766E&color=fff' },
  { id: 7, name: 'Fernanda Lima', email: 'fe.lima@email.com', phone: '(21) 92109-8765', age: 29, status: 'Ativo', lastVisit: '2024-01-13', avatar: 'https://ui-avatars.com/api/?name=Fernanda+Lima&background=0F766E&color=fff' },
  { id: 8, name: 'Lucas Pereira', email: 'lucas.p@email.com', phone: '(11) 91098-7654', age: 33, status: 'Ativo', lastVisit: '2024-01-09', avatar: 'https://ui-avatars.com/api/?name=Lucas+Pereira&background=0F766E&color=fff' },
  { id: 9, name: 'Camila Rocha', email: 'camila.r@email.com', phone: '(47) 90987-6543', age: 27, status: 'Ativo', lastVisit: '2024-01-16', avatar: 'https://ui-avatars.com/api/?name=Camila+Rocha&background=0F766E&color=fff' },
  { id: 10, name: 'Rafael Souza', email: 'rafael.s@email.com', phone: '(11) 99876-5432', age: 40, status: 'Ativo', lastVisit: '2024-01-08', avatar: 'https://ui-avatars.com/api/?name=Rafael+Souza&background=0F766E&color=fff' }
];

export const mockMealPlans = [
  {
    id: 1,
    patientId: 1,
    date: '2024-01-15',
    meals: [
      {
        id: 'm1',
        name: 'Café da Manhã',
        time: '07:00',
        foods: [
          { id: 'f1', foodId: 9, quantity: 50, unit: 'g', measure: '3 colheres de sopa' },
          { id: 'f2', foodId: 10, quantity: 200, unit: 'ml', measure: '1 copo' },
          { id: 'f3', foodId: 5, quantity: 100, unit: 'g', measure: '1 unidade' }
        ]
      },
      {
        id: 'm3',
        name: 'Almoço',
        time: '12:30',
        foods: [
          { id: 'f4', foodId: 1, quantity: 150, unit: 'g', measure: '4 colheres de sopa' },
          { id: 'f5', foodId: 2, quantity: 100, unit: 'g', measure: '2 conchas' },
          { id: 'f6', foodId: 3, quantity: 120, unit: 'g', measure: '1 filé médio' },
          { id: 'f7', foodId: 7, quantity: 80, unit: 'g', measure: '3 colheres de sopa' }
        ]
      },
      {
        id: 'm5',
        name: 'Jantar',
        time: '19:00',
        foods: [
          { id: 'f8', foodId: 6, quantity: 150, unit: 'g', measure: '1 batata média' },
          { id: 'f9', foodId: 16, quantity: 120, unit: 'g', measure: '1 filé' },
          { id: 'f10', foodId: 14, quantity: 100, unit: 'g', measure: '2 unidades' }
        ]
      }
    ]
  }
];

export const householdMeasures = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'unidade', label: 'Unidade' },
  { value: 'colher_sopa', label: 'Colher de sopa' },
  { value: 'colher_cha', label: 'Colher de chá' },
  { value: 'xicara', label: 'Xícara' },
  { value: 'copo', label: 'Copo' },
  { value: 'concha', label: 'Concha' },
  { value: 'fatia', label: 'Fatia' },
  { value: 'porcao', label: 'Porção' }
];

export const anamnesisAlerts = [
  { condition: 'Gastrite', alert: 'Evitar café, condimentos e alimentos ácidos' },
  { condition: 'Diabetes', alert: 'Controlar carboidratos e açúcares' },
  { condition: 'Hipertensão', alert: 'Reduzir sódio e sal' },
  { condition: 'Intolerância à lactose', alert: 'Evitar laticínios ou usar versões sem lactose' }
];
