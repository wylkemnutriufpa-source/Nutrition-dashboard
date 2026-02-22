import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = ({ children, title, showBack = false, userType }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('fitjourney_user_type');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userType={userType} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center space-x-4">
            {showBack && (
              <Button
                data-testid="back-button"
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;