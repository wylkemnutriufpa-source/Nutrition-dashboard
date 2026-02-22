import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Stethoscope, Eye, ArrowLeft } from 'lucide-react';
import { mockPatients } from '@/data/mockData';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const handleProfessionalLogin = (e) => {
    e.preventDefault();
    
    if (email === 'wylkem.nutri.ufpa@gmail.com' && password === '123456') {
      localStorage.setItem('fitjourney_user_type', 'professional');
      localStorage.setItem('fitjourney_user_email', email);
      toast.success('Login realizado com sucesso!');
      navigate('/professional/dashboard');
    } else {
      toast.error('Email ou senha incorretos');
    }
  };

  const handlePatientLogin = (e) => {
    e.preventDefault();
    
    if (selectedPatientId) {
      const patient = mockPatients.find(p => p.id === parseInt(selectedPatientId));
      localStorage.setItem('fitjourney_user_type', 'patient');
      localStorage.setItem('fitjourney_patient_id', selectedPatientId);
      localStorage.setItem('fitjourney_patient_name', patient.name);
      toast.success(`Bem-vindo(a), ${patient.name}!`);
      navigate('/patient/dashboard');
    } else {
      toast.error('Selecione um paciente');
    }
  };

  const handleVisitorLogin = () => {
    localStorage.setItem('fitjourney_user_type', 'visitor');
    navigate('/visitor/calculators');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-600 mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">FJ</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">FitJourney</h1>
          <p className="text-lg text-gray-600">Sua jornada para uma vida mais saudável</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card data-testid="professional-login-card" className="hover:shadow-xl transition-all duration-300 border-2 hover:border-teal-700 cursor-pointer" onClick={() => handleLogin('professional')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <Stethoscope className="text-teal-700" size={32} />
              </div>
              <CardTitle className="text-xl">Profissional</CardTitle>
              <CardDescription>Acesso para nutricionistas e profissionais de saúde</CardDescription>
            </CardHeader>
            <CardContent>
              <Button data-testid="professional-login-button" className="w-full bg-teal-700 hover:bg-teal-800" size="lg">
                Entrar como Profissional
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="patient-login-card" className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-600 cursor-pointer" onClick={() => handleLogin('patient')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <User className="text-green-700" size={32} />
              </div>
              <CardTitle className="text-xl">Paciente</CardTitle>
              <CardDescription>Acesso para pacientes acompanharem seu plano alimentar</CardDescription>
            </CardHeader>
            <CardContent>
              <Button data-testid="patient-login-button" className="w-full bg-green-600 hover:bg-green-700" size="lg">
                Entrar como Paciente
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="visitor-login-card" className="hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-600 cursor-pointer" onClick={() => handleLogin('visitor')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Eye className="text-gray-700" size={32} />
              </div>
              <CardTitle className="text-xl">Visitante</CardTitle>
              <CardDescription>Experimente as calculadoras sem criar conta</CardDescription>
            </CardHeader>
            <CardContent>
              <Button data-testid="visitor-login-button" className="w-full bg-gray-700 hover:bg-gray-800" size="lg" variant="outline">
                Continuar como Visitante
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Protótipo de interface • Dados mockados para demonstração</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;