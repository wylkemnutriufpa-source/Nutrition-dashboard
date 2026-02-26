import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, Calculator, FileText, Settings, LogOut, 
  Database, Palette, Shield, ClipboardList, MessageSquare, Stethoscope,
  UserCog, Utensils, ChefHat, ShoppingCart, Pill, Lightbulb, TrendingUp,
  Menu as MenuIcon, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/contexts/BrandingContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientMenuConfig } from '@/lib/supabase';

// Mapa de ícones para o menu dinâmico
const iconMap = {
  Home, Utensils, ClipboardList, MessageSquare, ChefHat,
  ShoppingCart, Pill, Lightbulb, TrendingUp, Calculator,
  Calendar, Settings
};

const Sidebar = ({ userType, onLogout }) => {
  const location = useLocation();
  const { branding } = useBranding();
  const { user, profile } = useAuth();
  const [patientMenuItems, setPatientMenuItems] = useState(null);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Carrega menu dinâmico para pacientes
  useEffect(() => {
    if (userType === 'patient' && user) {
      loadPatientMenu();
    }
  }, [userType, user]);

  const loadPatientMenu = async () => {
    setLoadingMenu(true);
    try {
      // Busca configuração do menu do profissional do paciente
      const professionalId = profile?.professional_id;
      const { data } = await getPatientMenuConfig(user?.id, professionalId);
      if (data?.items) {
        setPatientMenuItems(data.items.filter(item => item.visible).sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error loading patient menu:', error);
    } finally {
      setLoadingMenu(false);
    }
  };

  const getIcon = (iconName) => {
    return iconMap[iconName] || Home;
  };

  // Links do Professional (admin também tem acesso)
  const professionalLinks = [
    { to: '/professional/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/professional/patients', icon: Users, label: 'Pacientes' },
    { to: '/professional/food-database', icon: Database, label: 'Alimentos' },
    { to: '/professional/menu-config', icon: MenuIcon, label: 'Menu Paciente' },
    { to: '/professional/branding', icon: Palette, label: 'Personalização' },
    { to: '/professional/settings', icon: Settings, label: 'Configurações' }
  ];

  // Links exclusivos do Admin
  const adminExtraLinks = [
    { to: '/admin/dashboard', icon: Shield, label: 'Painel Admin' },
    { to: '/admin/professionals', icon: UserCog, label: 'Profissionais' }
  ];

  // Links padrão do Paciente (usado se não tiver config dinâmica)
  const defaultPatientLinks = [
    { to: '/patient/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/patient/meal-plan', icon: Utensils, label: 'Meu Plano' },
    { to: '/patient/checklist', icon: ClipboardList, label: 'Minhas Tarefas' },
    { to: '/patient/feedback', icon: MessageSquare, label: 'Meus Feedbacks' },
    { to: '/patient/recipes', icon: ChefHat, label: 'Minhas Receitas' },
    { to: '/patient/shopping-list', icon: ShoppingCart, label: 'Lista de Compras' },
    { to: '/patient/supplements', icon: Pill, label: 'Suplementos' },
    { to: '/patient/tips', icon: Lightbulb, label: 'Dicas' },
    { to: '/patient/journey', icon: TrendingUp, label: 'Minha Jornada' },
    { to: '/patient/calculators', icon: Calculator, label: 'Calculadoras' }
  ];

  // Links do Visitante
  const visitorLinks = [
    { to: '/visitor/calculators', icon: Calculator, label: 'Calculadoras' },
    { to: '/visitor/projeto', icon: TrendingUp, label: 'Conheça o Projeto' }
  ];

  // Gerar links do paciente dinamicamente
  const getPatientLinks = () => {
    if (patientMenuItems && patientMenuItems.length > 0) {
      return patientMenuItems.map(item => ({
        to: item.route,
        icon: getIcon(item.icon),
        label: item.label
      }));
    }
    return defaultPatientLinks;
  };

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
        return getPatientLinks();
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
