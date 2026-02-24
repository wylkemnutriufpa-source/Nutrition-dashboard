import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Calculator, FileText, Settings, LogOut, Database, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/contexts/BrandingContext';

const Sidebar = ({ userType, onLogout }) => {
  const location = useLocation();

  const professionalLinks = [
    { to: '/professional/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/professional/patients', icon: Users, label: 'Pacientes' },
    { to: '/professional/food-database', icon: Database, label: 'Banco de Alimentos' },
    { to: '/professional/settings', icon: Settings, label: 'Configurações' }
  ];

  const patientLinks = [
    { to: '/patient/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/patient/meal-plan', icon: Calendar, label: 'Meu Plano' },
    { to: '/patient/calculators', icon: Calculator, label: 'Calculadoras' },
    { to: '/patient/feedback', icon: FileText, label: 'Feedbacks' }
  ];

  const visitorLinks = [
    { to: '/visitor/calculators', icon: Calculator, label: 'Calculadoras' }
  ];

  const links = userType === 'professional' ? professionalLinks : userType === 'patient' ? patientLinks : visitorLinks;

  return (
    <div data-testid="sidebar" className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-700 to-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">FJ</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">FitJourney</h1>
            <p className="text-xs text-gray-500">{userType === 'professional' ? 'Profissional' : userType === 'patient' ? 'Paciente' : 'Visitante'}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`sidebar-link-${link.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
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