import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Stethoscope, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { mockPatients } from '@/data/mockData';
import { toast } from 'sonner';
import { useBranding } from '@/contexts/BrandingContext';
import { signIn, signUp, getUserProfile } from '@/lib/supabase';

const LoginPage = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [loginType, setLoginType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({
    name: '',
    role: 'professional'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const profile = await getUserProfile(data.user.id);
        
        if (!profile) {
          toast.error('Perfil não encontrado');
          setLoading(false);
          return;
        }

        // Armazenar no localStorage (compatibilidade)
        localStorage.setItem('fitjourney_user_type', profile.role);
        localStorage.setItem('fitjourney_user_email', profile.email);

        toast.success('Login realizado com sucesso!');

        // Redirecionar baseado no role
        if (profile.role === 'professional') {
          navigate('/professional/dashboard');
        } else if (profile.role === 'patient') {
          localStorage.setItem('fitjourney_patient_id', profile.id);
          localStorage.setItem('fitjourney_patient_name', profile.name);
          navigate('/patient/dashboard');
        } else if (profile.role === 'admin') {
          navigate('/professional/dashboard'); // Admin usa mesma interface
        }
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, {
        name: signUpData.name,
        role: signUpData.role
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success('Conta criada! Verifique seu email para confirmar.');
      setIsSignUp(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      toast.error('Erro ao criar conta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitorLogin = () => {
    localStorage.setItem('fitjourney_user_type', 'visitor');
    navigate('/visitor/calculators');
  };

  if (!loginType) {
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
            <Card data-testid="professional-login-card" className="hover:shadow-xl transition-all duration-300 border-2 hover:border-teal-700 cursor-pointer" onClick={() => setLoginType('professional')}>
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

            <Card data-testid="patient-login-card" className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-600 cursor-pointer" onClick={() => setLoginType('patient')}>
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

            <Card data-testid="visitor-login-card" className="hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-600 cursor-pointer" onClick={handleVisitorLogin}>
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
  }

  if (loginType === 'professional' || loginType === 'patient') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Button
            variant="ghost"
            onClick={() => setLoginType(null)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={18} />
            Voltar
          </Button>

          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                {loginType === 'professional' ? (
                  <Stethoscope className="text-teal-700" size={32} />
                ) : (
                  <User className="text-green-700" size={32} />
                )}
              </div>
              <CardTitle className="text-2xl">
                {isSignUp ? 'Criar Conta' : 'Login'} {loginType === 'professional' ? 'Profissional' : 'Paciente'}
              </CardTitle>
              <CardDescription>
                {isSignUp ? 'Cadastre-se no sistema' : 'Entre com suas credenciais'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
                {isSignUp && (
                  <>
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        type="text"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        required
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Tipo de Conta</Label>
                      <Select
                        value={signUpData.role}
                        onValueChange={(v) => setSignUpData({ ...signUpData, role: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="patient">Paciente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-teal-700 hover:bg-teal-800"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isSignUp ? 'Criando...' : 'Entrando...'}
                    </>
                  ) : (
                    <>{isSignUp ? 'Criar Conta' : 'Entrar'}</>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-teal-700 hover:underline"
                >
                  {isSignUp ? 'Já tem uma conta? Fazer login' : 'Não tem conta? Cadastre-se'}
                </button>
              </div>

              {!isSignUp && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold mb-2">🎯 Modo Demo (para testes):</p>
                  <p className="text-xs text-gray-600">Configure suas credenciais Supabase no arquivo .env</p>
                  <p className="text-xs text-gray-600 mt-1">Ou clique em "Cadastre-se" para criar sua conta</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default LoginPage;