import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminBar from '@/components/AdminBar';
import ErrorBoundary from '@/components/ErrorBoundary';

import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import ProfessionalDashboard from '@/pages/ProfessionalDashboard';
import PatientsList from '@/pages/PatientsList';
import PatientProfile from '@/pages/PatientProfile';
import MealPlanEditor from '@/pages/MealPlanEditor';
import PatientDashboard from '@/pages/PatientDashboard';
import PatientTarefas from '@/pages/PatientTarefas';
import PatientFeedbacks from '@/pages/PatientFeedbacks';
import PatientReceitas from '@/pages/PatientReceitas';
import PatientListaCompras from '@/pages/PatientListaCompras';
import PatientSuplementos from '@/pages/PatientSuplementos';
import PatientDicas from '@/pages/PatientDicas';
import PatientJornada from '@/pages/PatientJornada';
import CalculatorsList from '@/pages/CalculatorsList';
import WeightCalculator from '@/pages/WeightCalculator';
import WaterCalculator from '@/pages/WaterCalculator';
import SettingsPage from '@/pages/SettingsPage';
import FoodDatabase from '@/pages/FoodDatabase';
import BrandingSettings from '@/pages/BrandingSettings';
import HealthCheckQuiz from '@/pages/HealthCheckQuiz';

// Rota protegida com suporte a admin override
const ProtectedRoute = ({ children, allowedTypes }) => {
  const userType = localStorage.getItem('fitjourney_user_type');
  
  if (!userType) {
    return <Navigate to="/" replace />;
  }
  
  // Admin tem acesso a TUDO (override) - mantém sua role
  if (userType === 'admin') {
    return children;
  }
  
  if (allowedTypes && !allowedTypes.includes(userType)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  useEffect(() => {
    document.title = 'FitJourney - Sua jornada para uma vida mais saudável';
  }, []);

  return (
    <ErrorBoundary>
      <div className="App">
        <AuthProvider>
          <BrandingProvider>
            <BrowserRouter>
              {/* AdminBar: aparece automaticamente quando admin está em outras áreas */}
              <AdminBar />
              
              <Routes>
                <Route path="/" element={<LoginPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedTypes={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/professionals" element={
                <ProtectedRoute allowedTypes={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* Professional Routes - Admin também pode acessar */}
              <Route path="/professional/dashboard" element={
                <ProtectedRoute allowedTypes={['professional', 'admin']}>
                  <ProfessionalDashboard />
                </ProtectedRoute>
              } />
              <Route path="/professional/patients" element={
                <ProtectedRoute allowedTypes={['professional', 'admin']}>
                  <PatientsList />
                </ProtectedRoute>
              } />
              <Route path="/professional/patient/:id" element={
                <ProtectedRoute allowedTypes={['professional', 'admin']}>
                  <PatientProfile />
                </ProtectedRoute>
              } />
              <Route path="/professional/meal-plan-editor" element={
                <ProtectedRoute allowedTypes={['professional', 'admin']}>
                  <MealPlanEditor />
                </ProtectedRoute>
              } />
              <Route path="/professional/settings" element={
                <ProtectedRoute allowedTypes={['professional', 'admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/professional/food-database" element={
                <ProtectedRoute allowedTypes={['professional', 'admin']}>
                  <FoodDatabase />
                </ProtectedRoute>
              } />
              <Route path="/professional/branding" element={
                <ProtectedRoute allowedTypes={['professional', 'admin']}>
                  <BrandingSettings />
                </ProtectedRoute>
              } />
              
              {/* Patient Routes */}
              <Route path="/patient/dashboard" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/patient/meal-plan" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/patient/checklist" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/patient/messages" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/patient/calculators" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <CalculatorsList userType="patient" />
                </ProtectedRoute>
              } />
              <Route path="/patient/calculator/weight" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <WeightCalculator userType="patient" />
                </ProtectedRoute>
              } />
              <Route path="/patient/calculator/water" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <WaterCalculator userType="patient" />
                </ProtectedRoute>
              } />
              <Route path="/patient/feedback" element={
                <ProtectedRoute allowedTypes={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              
              {/* Visitor Routes */}
              <Route path="/visitor/health-check" element={
                <ProtectedRoute allowedTypes={['visitor']}>
                  <HealthCheckQuiz />
                </ProtectedRoute>
              } />
              <Route path="/visitor/calculators" element={
                <ProtectedRoute allowedTypes={['visitor']}>
                  <CalculatorsList userType="visitor" />
                </ProtectedRoute>
              } />
              <Route path="/visitor/calculator/weight" element={
                <ProtectedRoute allowedTypes={['visitor']}>
                  <WeightCalculator userType="visitor" />
                </ProtectedRoute>
              } />
              <Route path="/visitor/calculator/water" element={
                <ProtectedRoute allowedTypes={['visitor']}>
                  <WaterCalculator userType="visitor" />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </BrandingProvider>
      </AuthProvider>
      {/* Toaster fora do Router para evitar unmount durante navegação */}
      <Toaster position="top-right" duration={3000} />
    </div>
    </ErrorBoundary>
  );
}

export default App;
