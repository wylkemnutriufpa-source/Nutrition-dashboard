import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, Search, Loader2, User, Phone, Mail, Calendar, Ruler, Scale, Target,
  MoreVertical, Eye, Edit, Archive, ClipboardList, Utensils, ArrowUpDown,
  Filter, Undo2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getProfessionalPatients, 
  createPatientByProfessional, 
  updatePatient,
  archivePatient,
  restorePatient,
  getAllProfessionals
} from '@/lib/supabase';
import { toast } from 'sonner';

const PatientsList = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [orderBy, setOrderBy] = useState('recent');
  const [filterProfessional, setFilterProfessional] = useState('all');
  const [lastArchived, setLastArchived] = useState(null);
  
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

  const loadData = useCallback(async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      // Buscar profissionais se admin
      if (isAdmin) {
        const { data: profsData } = await getAllProfessionals();
        setProfessionals(profsData || []);
      }
      
      // Buscar pacientes
      const filters = {
        orderBy: orderBy === 'name' ? 'name' : undefined,
        professionalId: isAdmin && filterProfessional !== 'all' ? filterProfessional : undefined
      };
      
      const { data, error } = await getProfessionalPatients(profile.id, isAdmin, filters);
      if (error) throw error;
      
      const mappedPatients = (data || []).map(item => ({
        id: item.patient.id,
        name: item.patient.name,
        email: item.patient.email,
        phone: item.patient.phone || '',
        birth_date: item.patient.birth_date,
        gender: item.patient.gender,
        height: item.patient.height,
        current_weight: item.patient.current_weight,
        goal_weight: item.patient.goal_weight,
        goal: item.patient.goal,
        notes: item.patient.notes,
        status: item.patient.status,
        professional_id: item.professional_id,
        created_at: item.created_at,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.patient.name)}&background=0F766E&color=fff`
      }));
      
      // Ordenar localmente se necessário
      if (orderBy === 'name') {
        mappedPatients.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setPatients(mappedPatients);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  }, [user, profile, isAdmin, orderBy, filterProfessional]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', birth_date: '', gender: '',
      height: '', current_weight: '', goal_weight: '', goal: '', notes: ''
    });
  };

  const handleCreatePatient = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const patientData = {
        ...formData,
        height: formData.height ? parseFloat(formData.height) : null,
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
        goal_weight: formData.goal_weight ? parseFloat(formData.goal_weight) : null,
      };

      const { data, error } = await createPatientByProfessional(profile.id, patientData);
      if (error) throw error;
      
      toast.success('Paciente criado com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Erro ao criar paciente');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPatient = async () => {
    if (!selectedPatient) return;

    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
        goal_weight: formData.goal_weight ? parseFloat(formData.goal_weight) : null,
        goal: formData.goal || null,
        notes: formData.notes || null
      };

      const { error } = await updatePatient(selectedPatient.id, updates);
      if (error) throw error;

      toast.success('Paciente atualizado!');
      setIsEditDialogOpen(false);
      setSelectedPatient(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Erro ao atualizar paciente');
    } finally {
      setSaving(false);
    }
  };

  const handleArchivePatient = async () => {
    if (!selectedPatient) return;

    try {
      const { error } = await archivePatient(selectedPatient.id);
      if (error) throw error;

      setLastArchived(selectedPatient);
      toast.success(
        <div className="flex items-center justify-between w-full">
          <span>Paciente arquivado</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-teal-700"
            onClick={() => handleUndoArchive(selectedPatient.id)}
          >
            <Undo2 size={14} className="mr-1" /> Desfazer
          </Button>
        </div>,
        { duration: 5000 }
      );
      
      setIsArchiveDialogOpen(false);
      setSelectedPatient(null);
      await loadData();
    } catch (error) {
      console.error('Error archiving patient:', error);
      toast.error('Erro ao arquivar paciente');
    }
  };

  const handleUndoArchive = async (patientId) => {
    try {
      const { error } = await restorePatient(patientId);
      if (error) throw error;
      
      toast.success('Paciente restaurado!');
      setLastArchived(null);
      await loadData();
    } catch (error) {
      console.error('Error restoring patient:', error);
      toast.error('Erro ao restaurar paciente');
    }
  };

  const openEditDialog = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone || '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || '',
      height: patient.height || '',
      current_weight: patient.current_weight || '',
      goal_weight: patient.goal_weight || '',
      goal: patient.goal || '',
      notes: patient.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const openArchiveDialog = (patient) => {
    setSelectedPatient(patient);
    setIsArchiveDialogOpen(true);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getGoalLabel = (goal) => {
    const goals = {
      'weight_loss': 'Emagrecimento',
      'muscle_gain': 'Ganho de Massa',
      'maintenance': 'Manutenção',
      'health': 'Saúde',
      'sports': 'Performance',
      'other': 'Outro'
    };
    return goals[goal] || goal || '';
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PatientFormFields = ({ isEdit = false }) => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <User className="mr-2" size={18} />
          Dados Pessoais
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nome Completo *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do paciente"
            />
          </div>
          <div>
            <Label>Email {!isEdit && '*'}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="pl-10"
                disabled={isEdit}
              />
            </div>
          </div>
          <div>
            <Label>Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label>Data de Nascimento</Label>
            <Input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Sexo</Label>
            <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Ruler className="mr-2" size={18} />
          Dados Físicos
        </h4>
        <div className="grid grid-cols-3 gap-4">
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
              step="0.1"
              value={formData.current_weight}
              onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
              placeholder="70.5"
            />
          </div>
          <div>
            <Label>Peso Meta (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.goal_weight}
              onChange={(e) => setFormData({ ...formData, goal_weight: e.target.value })}
              placeholder="65.0"
            />
          </div>
        </div>
      </div>

      <div className="bg-teal-50 p-4 rounded-lg space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Target className="mr-2" size={18} />
          Objetivo
        </h4>
        <Select value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })}>
          <SelectTrigger><SelectValue placeholder="Selecione o objetivo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weight_loss">Emagrecimento</SelectItem>
            <SelectItem value="muscle_gain">Ganho de Massa Muscular</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
            <SelectItem value="health">Saúde/Reeducação Alimentar</SelectItem>
            <SelectItem value="sports">Performance Esportiva</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observações gerais..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Pacientes" userType={profile?.role || 'professional'}>
      <div data-testid="patients-list" className="space-y-6">
        {/* Header com busca e filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2">
            {/* Filtro por profissional (só admin) */}
            {isAdmin && professionals.length > 0 && (
              <Select value={filterProfessional} onValueChange={setFilterProfessional}>
                <SelectTrigger className="w-[180px]">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Profissionais</SelectItem>
                  {professionals.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Ordenação */}
            <Select value={orderBy} onValueChange={setOrderBy}>
              <SelectTrigger className="w-[150px]">
                <ArrowUpDown size={16} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="name">Alfabético</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Botão criar */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-700 hover:bg-teal-800" size="lg" onClick={resetForm}>
                <Plus size={20} className="mr-2" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Paciente</DialogTitle>
                <DialogDescription>Cadastre um novo paciente</DialogDescription>
              </DialogHeader>
              <PatientFormFields />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1" disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePatient} className="flex-1 bg-teal-700 hover:bg-teal-800" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><Plus className="mr-2" size={18} />Criar Paciente</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de pacientes */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tente outra busca' : 'Comece cadastrando seu primeiro paciente'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-teal-700 hover:bg-teal-800">
                  <Plus size={18} className="mr-2" />
                  Cadastrar Paciente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => {
              const age = calculateAge(patient.birth_date);
              return (
                <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-4 flex-1 cursor-pointer"
                        onClick={() => navigate(`/professional/patient/${patient.id}`)}
                      >
                        <img src={patient.avatar} alt={patient.name} className="w-16 h-16 rounded-full" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                          {patient.phone && <p className="text-sm text-gray-500">{patient.phone}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right space-y-1 hidden md:block">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                          {age && <p className="text-sm text-gray-600">{age} anos</p>}
                          {patient.goal && (
                            <p className="text-xs text-gray-500">{getGoalLabel(patient.goal)}</p>
                          )}
                          {patient.current_weight && patient.goal_weight && (
                            <p className="text-xs text-gray-500">
                              {patient.current_weight}kg → {patient.goal_weight}kg
                            </p>
                          )}
                        </div>
                        
                        {/* Menu de ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/professional/patient/${patient.id}`)}>
                              <Eye size={16} className="mr-2" /> Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(patient)}>
                              <Edit size={16} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/professional/patient/${patient.id}?tab=checklist`)}>
                              <ClipboardList size={16} className="mr-2" /> Checklist
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/professional/meal-plan-editor?patient=${patient.id}`)}>
                              <Utensils size={16} className="mr-2" /> Plano Alimentar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openArchiveDialog(patient)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Archive size={16} className="mr-2" /> Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
              <DialogDescription>Atualize os dados do paciente</DialogDescription>
            </DialogHeader>
            <PatientFormFields isEdit />
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1" disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleEditPatient} className="flex-1 bg-teal-700 hover:bg-teal-800" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar Alterações'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de arquivar */}
        <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arquivar Paciente</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja arquivar <strong>{selectedPatient?.name}</strong>?
                <br /><br />
                O paciente será marcado como inativo e não aparecerá mais na lista principal. 
                Você poderá restaurá-lo depois se necessário.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchivePatient} className="bg-red-600 hover:bg-red-700">
                Arquivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default PatientsList;
