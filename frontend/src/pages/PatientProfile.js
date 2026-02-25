import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, FileText, Utensils, AlertTriangle, Edit, Loader2, User, Save, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientById, updatePatient, getPatientMealPlan, getAnamnesis, getMealPlans } from '@/lib/supabase';
import { toast } from 'sonner';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [allMealPlans, setAllMealPlans] = useState([]);
  const [anamnesis, setAnamnesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (id && user) {
      loadPatientData();
    }
  }, [id, user]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Carregar dados do paciente
      const { data: patientData, error: patientError } = await getPatientById(id);
      if (patientError) throw patientError;
      setPatient(patientData);
      setEditData(patientData);

      // Carregar plano alimentar ativo
      const { data: planData } = await getPatientMealPlan(id, user.id);
      setMealPlan(planData);

      // Carregar todos os planos do paciente
      const { data: allPlans } = await getMealPlans(user.id, 'professional');
      const patientPlans = (allPlans || []).filter(p => p.patient_id === id);
      setAllMealPlans(patientPlans);

      // Carregar anamnese
      const { data: anamnesisData } = await getAnamnesis(id);
      setAnamnesis(anamnesisData);

    } catch (error) {
      console.error('Error loading patient:', error);
      toast.error('Erro ao carregar dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePatient = async () => {
    setSaving(true);
    try {
      const updates = {
        name: editData.name,
        phone: editData.phone,
        birth_date: editData.birth_date,
        gender: editData.gender,
        height: editData.height ? parseFloat(editData.height) : null,
        current_weight: editData.current_weight ? parseFloat(editData.current_weight) : null,
        goal_weight: editData.goal_weight ? parseFloat(editData.goal_weight) : null,
        goal: editData.goal,
        notes: editData.notes,
        status: editData.status
      };

      const { error } = await updatePatient(id, updates);
      if (error) throw error;

      toast.success('Dados atualizados com sucesso!');
      setIsEditing(false);
      await loadPatientData();
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateIMC = () => {
    if (!patient?.height || !patient?.current_weight) return null;
    const heightInMeters = patient.height / 100;
    return (patient.current_weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getIMCClassification = (imc) => {
    if (!imc) return '';
    const value = parseFloat(imc);
    if (value < 18.5) return 'Abaixo do peso';
    if (value < 25) return 'Peso normal';
    if (value < 30) return 'Sobrepeso';
    if (value < 35) return 'Obesidade I';
    if (value < 40) return 'Obesidade II';
    return 'Obesidade III';
  };

  const getGoalLabel = (goal) => {
    const goals = {
      'weight_loss': 'Emagrecimento',
      'muscle_gain': 'Ganho de Massa Muscular',
      'maintenance': 'Manutenção',
      'health': 'Saúde/Reeducação Alimentar',
      'sports': 'Performance Esportiva',
      'other': 'Outro'
    };
    return goals[goal] || goal || 'Não definido';
  };

  if (loading) {
    return (
      <Layout title="Carregando..." showBack userType="professional">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="Paciente não encontrado" showBack userType="professional">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">Paciente não encontrado ou sem permissão de acesso</p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/professional/patients')}
            >
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0F766E&color=fff&size=200`;
  const age = calculateAge(patient.birth_date);
  const imc = calculateIMC();

  return (
    <Layout title={patient.name} showBack userType="professional">
      <div data-testid="patient-profile" className="space-y-6">
        {/* Header com dados do paciente */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <img src={avatar} alt={patient.name} className="w-24 h-24 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-2" size={16} />
                    Editar
                  </Button>
                </div>
                <p className="text-gray-600">{patient.email}</p>
                <p className="text-gray-600">{patient.phone || 'Telefone não informado'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  {patient.goal && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-700">
                      {getGoalLabel(patient.goal)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right space-y-2">
                {age && (
                  <div>
                    <p className="text-sm text-gray-600">Idade</p>
                    <p className="text-2xl font-bold text-gray-900">{age} anos</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de edição */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
              <DialogDescription>
                Atualize os dados do paciente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit_name">Nome Completo</Label>
                  <Input
                    id="edit_name"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Telefone</Label>
                  <Input
                    id="edit_phone"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select value={editData.status || 'active'} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
                  <Input
                    id="edit_birth_date"
                    type="date"
                    value={editData.birth_date || ''}
                    onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_gender">Sexo</Label>
                  <Select value={editData.gender || ''} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_height">Altura (cm)</Label>
                  <Input
                    id="edit_height"
                    type="number"
                    value={editData.height || ''}
                    onChange={(e) => setEditData({ ...editData, height: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_current_weight">Peso Atual (kg)</Label>
                  <Input
                    id="edit_current_weight"
                    type="number"
                    step="0.1"
                    value={editData.current_weight || ''}
                    onChange={(e) => setEditData({ ...editData, current_weight: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_goal_weight">Peso Meta (kg)</Label>
                  <Input
                    id="edit_goal_weight"
                    type="number"
                    step="0.1"
                    value={editData.goal_weight || ''}
                    onChange={(e) => setEditData({ ...editData, goal_weight: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_goal">Objetivo</Label>
                  <Select value={editData.goal || ''} onValueChange={(v) => setEditData({ ...editData, goal: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Emagrecimento</SelectItem>
                      <SelectItem value="muscle_gain">Ganho de Massa Muscular</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="health">Saúde/Reeducação Alimentar</SelectItem>
                      <SelectItem value="sports">Performance Esportiva</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_notes">Observações</Label>
                  <Textarea
                    id="edit_notes"
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(patient);
                  }}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSavePatient}
                  className="flex-1 bg-teal-700 hover:bg-teal-800"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={18} />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabs com informações */}
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            <TabsTrigger value="plano">Plano Alimentar</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Físicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Peso Atual</p>
                      <p className="text-lg font-semibold">{patient.current_weight ? `${patient.current_weight} kg` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Peso Meta</p>
                      <p className="text-lg font-semibold">{patient.goal_weight ? `${patient.goal_weight} kg` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Altura</p>
                      <p className="text-lg font-semibold">{patient.height ? `${patient.height} cm` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IMC</p>
                      <p className="text-lg font-semibold">
                        {imc || '-'}
                        {imc && <span className="text-sm text-gray-500 ml-1">({getIMCClassification(imc)})</span>}
                      </p>
                    </div>
                  </div>
                  {patient.current_weight && patient.goal_weight && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">Progresso</p>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-teal-700 h-3 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, ((patient.current_weight - patient.goal_weight) / (patient.current_weight)) * 100))}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Faltam {Math.abs(patient.current_weight - patient.goal_weight).toFixed(1)} kg
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Sexo</p>
                      <p className="text-lg font-semibold">
                        {patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Feminino' : patient.gender || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data de Nascimento</p>
                      <p className="text-lg font-semibold">
                        {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Objetivo</p>
                      <p className="text-lg font-semibold">{getGoalLabel(patient.goal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {patient.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{patient.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="anamnese" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 text-amber-600" size={20} />
                  Anamnese
                </CardTitle>
              </CardHeader>
              <CardContent>
                {anamnesis ? (
                  <div className="space-y-4">
                    {anamnesis.conditions && anamnesis.conditions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Condições/Alertas</h4>
                        <div className="space-y-2">
                          {anamnesis.conditions.map((item, index) => (
                            <div key={index} className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                              <p className="font-semibold text-amber-900">{item.condition}</p>
                              <p className="text-sm text-amber-700">{item.alert}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {anamnesis.allergies && anamnesis.allergies.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Alergias</h4>
                        <div className="flex flex-wrap gap-2">
                          {anamnesis.allergies.map((allergy, index) => (
                            <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {anamnesis.observations && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
                        <p className="text-gray-700">{anamnesis.observations}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                    <p>Nenhuma anamnese cadastrada</p>
                    <Button className="mt-4 bg-teal-700 hover:bg-teal-800">
                      <Plus size={18} className="mr-2" />
                      Criar Anamnese
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plano" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Plano Alimentar</CardTitle>
              </CardHeader>
              <CardContent>
                {mealPlan ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <h4 className="font-semibold text-green-900">{mealPlan.name}</h4>
                        <p className="text-sm text-green-700">
                          Atualizado em: {new Date(mealPlan.updated_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Ativo
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-teal-700 hover:bg-teal-800"
                        onClick={() => navigate(`/professional/meal-plan-editor?patient=${id}&plan=${mealPlan.id}`)}
                      >
                        <Edit className="mr-2" size={18} />
                        Editar Plano
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="mx-auto mb-4 text-gray-400" size={48} />
                    <p>Nenhum plano alimentar ativo</p>
                    <Button 
                      className="mt-4 bg-teal-700 hover:bg-teal-800"
                      onClick={() => navigate(`/professional/meal-plan-editor?patient=${id}`)}
                    >
                      <Plus size={18} className="mr-2" />
                      Criar Plano Alimentar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Planos</CardTitle>
              </CardHeader>
              <CardContent>
                {allMealPlans.length > 0 ? (
                  <div className="space-y-3">
                    {allMealPlans.map((plan) => (
                      <div 
                        key={plan.id} 
                        className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                          plan.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => navigate(`/professional/meal-plan-editor?patient=${id}&plan=${plan.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                            <p className="text-sm text-gray-600">
                              Criado em: {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                    <p>Nenhum plano no histórico</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PatientProfile;
