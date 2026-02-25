import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Users, Calendar, Calculator, FileText, Settings, LogOut, 
  Database, Palette, Shield, ClipboardList, MessageSquare, Stethoscope,
  UserCog, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/contexts/BrandingContext';

const Sidebar = ({ userType, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { branding } = useBranding();

  // Detectar se está em calculadoras ou health check
  const isInHealthCheck = location.pathname.includes('/health-check');
  const isInCalculators = location.pathname.includes('/calculator');

  // Links do Professional (admin também tem acesso)
  const professionalLinks = [
    { to: '/professional/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/professional/patients', icon: Users, label: 'Pacientes' },
    { to: '/professional/food-database', icon: Database, label: 'Alimentos' },
    { to: '/professional/branding', icon: Palette, label: 'Personalização' },
    { to: '/professional/settings', icon: Settings, label: 'Configurações' }
  ];

  // Links exclusivos do Admin
  const adminExtraLinks = [
    { to: '/admin/dashboard', icon: Shield, label: 'Painel Admin' },
    { to: '/admin/professionals', icon: UserCog, label: 'Profissionais' }
  ];

  // Links do Paciente
  const patientLinks = [
    { to: '/patient/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/patient/meal-plan', icon: Calendar, label: 'Meu Plano' },
    { to: '/patient/checklist', icon: ClipboardList, label: 'Tarefas' },
    { to: '/patient/messages', icon: MessageSquare, label: 'Recados' },
    { to: '/patient/calculators', icon: Calculator, label: 'Calculadoras' }
  ];

  // Links do Visitante
  const visitorLinks = [
    { to: '/visitor/calculators', icon: Calculator, label: 'Ferramentas' }
  ];

  // Montar menu baseado no tipo de usuário
  const getLinks = () => {
    switch (userType) {
      case 'admin':
        // Admin tem TUDO do professional + links admin extras
        return [...adminExtraLinks, ...professionalLinks.map(l => ({
          ...l,
          // Manter as mesmas rotas do professional
        }))];
      case 'professional':
        return professionalLinks;
      case 'patient':
        return patientLinks;
      default:
        return visitorLinks;
    }
  };

  const links = getLinks();

  const getUserTypeLabel = () => {
    switch(userType) {
      case 'admin': return 'Administrador';
      case 'professional': return 'Profissional';
      case 'patient': return 'Paciente';
      default: return 'Visitante';
    }
  };

  const getPrimaryColor = () => {
    if (userType === 'admin') return '#7C3AED';
    return branding.primaryColor || '#0F766E';
  };

  return (
    <div data-testid="sidebar" className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-2">
          {branding.logo ? (
            <img src={branding.logo} alt={branding.brandName} className="w-10 h-10 rounded-lg object-contain" />
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(to br, ${getPrimaryColor()}, ${branding.accentColor || '#059669'})` }}
            >
              <span className="text-white font-bold text-xl">
                {userType === 'admin' ? 'AD' : branding.brandName?.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{branding.brandName || 'FitJourney'}</h1>
            <p className="text-xs text-gray-500">{getUserTypeLabel()}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Separador para admin */}
        {userType === 'admin' && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase px-4 pt-2 pb-1">Admin</p>
            {adminExtraLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  data-testid={`sidebar-link-${link.label.toLowerCase().replace(/ /g, '-')}`}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive ? 'text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive ? { backgroundColor: '#7C3AED' } : {}}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{link.label}</span>
                </Link>
              );
            })}
            <p className="text-xs font-semibold text-gray-400 uppercase px-4 pt-4 pb-1">Nutrição</p>
          </>
        )}
        
        {/* Navegação condicional para visitante */}
        {userType === 'visitor' && (isInHealthCheck || isInCalculators) && (
          <>
            {isInHealthCheck && (
              <button
                onClick={() => navigate('/visitor/calculators')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
              >
                <Calculator size={20} />
                <span className="font-medium text-sm">Ver Calculadoras</span>
              </button>
            )}
            {isInCalculators && (
              <button
                onClick={() => navigate('/visitor/health-check')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-purple-600 hover:bg-purple-50 transition-all"
              >
                <Activity size={20} />
                <span className="font-medium text-sm">Check Nutricional</span>
              </button>
            )}
            <div className="border-t border-gray-200 my-2"></div>
          </>
        )}
        
        {/* Links principais */}
        {(userType === 'admin' ? professionalLinks : links).map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to || 
            (link.to === '/professional/patients' && location.pathname.startsWith('/professional/patient'));
          return (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`sidebar-link-${link.label.toLowerCase().replace(/ /g, '-')}`}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive ? 'text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={isActive ? { backgroundColor: getPrimaryColor() } : {}}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          data-testid="logout-button"
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut size={20} className="mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
