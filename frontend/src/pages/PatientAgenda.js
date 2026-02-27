import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Trash2, Loader2, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientAppointments, createAppointment, deleteAppointment } from '@/lib/supabase';

const TYPE_CONFIG = {
  presencial: { label: 'Presencial', color: 'bg-teal-500', bg: 'bg-teal-100', text: 'text-teal-700', icon: '🏢' },
  online: { label: 'Online', color: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-700', icon: '💻' },
  retorno: { label: 'Retorno', color: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-700', icon: '🔄' },
  lembrete: { label: 'Lembrete', color: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-700', icon: '🔔' },
  feedback: { label: 'Feedback', color: 'bg-pink-500', bg: 'bg-pink-100', text: 'text-pink-700', icon: '📝' },
  vencimento: { label: 'Vencimento Plano', color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-700', icon: '⚠️' },
};

const PatientAgenda = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', date: '', time: '', type: 'lembrete', notes: ''
  });

  useEffect(() => {
    if (user?.id) loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    setLoading(true);
    const { data } = await getPatientAppointments(user.id);
    setAppointments(data || []);
    setLoading(false);
  };

  const openModal = () => {
    setForm({ title: '', date: new Date().toISOString().split('T')[0], time: '', type: 'lembrete', notes: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error('Preencha título e data'); return; }
    setSaving(true);
    const { error } = await createAppointment({ ...form, patient_id: user.id, professional_id: null });
    if (error) { toast.error('Erro ao salvar'); } else {
      toast.success('Compromisso salvo!');
      setShowModal(false);
      loadAppointments();
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await deleteAppointment(id);
    toast.success('Removido!');
    loadAppointments();
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = appointments.filter(a => new Date(a.date + 'T00:00:00') >= now);
  const past = appointments.filter(a => new Date(a.date + 'T00:00:00') < now);

  if (loading) return (
    <Layout title="Minha Agenda" userType="patient">
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    </Layout>
  );

  return (
    <Layout title="Minha Agenda" userType="patient">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Minha Agenda</h2>
            <p className="text-gray-500">Consultas e lembretes</p>
          </div>
          <Button
            data-testid="new-reminder-btn"
            onClick={openModal}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lembrete
          </Button>
        </div>

        {/* Próximos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              Próximos Compromissos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum compromisso futuro</p>
                <p className="text-sm text-gray-400">Adicione lembretes para seus feedbacks e consultas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(appt => {
                  const cfg = TYPE_CONFIG[appt.type] || TYPE_CONFIG.lembrete;
                  return (
                    <div key={appt.id} data-testid={`appointment-${appt.id}`} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                      <div className={`w-3 h-3 mt-1.5 rounded-full flex-shrink-0 ${cfg.color}`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{appt.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">
                            {new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                          </span>
                          {appt.time && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />{appt.time.slice(0,5)}
                            </span>
                          )}
                        </div>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {appt.notes && <p className="text-sm text-gray-500 mt-1">{appt.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(appt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        {past.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-500">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {past.slice(0, 5).map(appt => (
                  <div key={appt.id} className="flex items-center gap-3 p-2 rounded opacity-60">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{appt.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Compromisso / Lembrete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Enviar feedback semanal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data *</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lembrete">Lembrete</SelectItem>
                    <SelectItem value="presencial">Consulta Presencial</SelectItem>
                    <SelectItem value="online">Consulta Online</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default PatientAgenda;
