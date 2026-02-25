import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2, User, Phone, Mail, Calendar, Ruler, Scale, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfessionalPatients, createPatientByProfessional } from '@/lib/supabase';
import { toast } from 'sonner';

const PatientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    height: '',
    current_weight: '',
    goal_weight: '',
    goal: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await getProfessionalPatients(user.id);
      if (error) throw error;
      
      // Mapear dados para formato esperado
      const mappedPatients = (data || []).map(item => ({
        id: item.patient.id,
        name: item.patient.name,
        email: item.patient.email,
        phone: item.patient.phone || 'Não informado',
        birth_date: item.patient.birth_date,
        gender: item.patient.gender,
        height: item.patient.height,
        current_weight: item.patient.current_weight,
        goal_weight: item.patient.goal_weight,
        goal: item.patient.goal,
        status: item.patient.status === 'active' ? 'Ativo' : 'Inativo',
        lastVisit: item.created_at,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.patient.name)}&background=0F766E&color=fff`
      }));
      
      setPatients(mappedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      birth_date: '',
      gender: '',
      height: '',
      current_weight: '',
      goal_weight: '',
      goal: '',
      notes: ''
    });
  };

  const handleCreatePatient = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSaving(true);
    try {
      const patientData = {
        ...formData,
        height: formData.height ? parseFloat(formData.height) : null,
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
        goal_weight: formData.goal_weight ? parseFloat(formData.goal_weight) : null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null
      };

      const { data, error } = await createPatientByProfessional(user.id, patientData);
      
      if (error) throw error;
      
      toast.success('Paciente criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      await loadPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Erro ao criar paciente');
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

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Pacientes" userType="professional">
      <div data-testid="patients-list" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <Input
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-700 hover:bg-teal-800" size="lg" onClick={() => resetForm()}>
                <Plus size={20} className="mr-2" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Paciente</DialogTitle>
                <DialogDescription>
                  Cadastre um novo paciente preenchendo os dados abaixo
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Dados Pessoais */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <User className="mr-2" size={18} />
                    Dados Pessoais
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nome do paciente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                        <Input
                          id="birth_date"
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="gender">Sexo</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Dados Físicos */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Ruler className="mr-2" size={18} />
                    Dados Físicos
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="170"
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_weight">Peso Atual (kg)</Label>
                      <Input
                        id="current_weight"
                        type="number"
                        step="0.1"
                        value={formData.current_weight}
                        onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                        placeholder="70.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="goal_weight">Peso Meta (kg)</Label>
                      <Input
                        id="goal_weight"
                        type="number"
                        step="0.1"
                        value={formData.goal_weight}
                        onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
                        placeholder="65.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Objetivo */}
                <div className="bg-teal-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Target className="mr-2" size={18} />
                    Objetivo
                  </h4>
                  <div>
                    <Label htmlFor="goal">Objetivo Principal</Label>
                    <Select value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })}>
                      <SelectTrigger id="goal">
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
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observações gerais sobre o paciente..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreatePatient}
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
                        <Plus className="mr-2" size={18} />
                        Criar Paciente
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum paciente encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece cadastrando seu primeiro paciente
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-teal-700 hover:bg-teal-800"
              >
                <Plus size={18} className="mr-2" />
                Cadastrar Paciente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => {
              const age = calculateAge(patient.birth_date);
              return (
                <Card 
                  key={patient.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => navigate(`/professional/patient/${patient.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src={patient.avatar} alt={patient.name} className="w-16 h-16 rounded-full" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                          <p className="text-sm text-gray-500">{patient.phone}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium ${
                          patient.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {patient.status}
                        </span>
                        {age && (
                          <p className="text-sm text-gray-600">{age} anos</p>
                        )}
                        {patient.current_weight && patient.goal_weight && (
                          <p className="text-xs text-gray-500">
                            {patient.current_weight}kg → {patient.goal_weight}kg
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Cadastro: {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PatientsList;
