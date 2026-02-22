import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { mockPatients } from '@/data/mockData';
import { useState } from 'react';

const PatientsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = mockPatients.filter(p =>
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
          <Button className="bg-teal-700 hover:bg-teal-800" size="lg">
            <Plus size={20} className="mr-2" />
            Novo Paciente
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/professional/patient/${patient.id}`)}>
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
                  <div className="text-right">
                    <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                      patient.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {patient.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-2">Última visita: {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PatientsList;