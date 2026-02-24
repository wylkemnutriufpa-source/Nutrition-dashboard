import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

import LoginPage from '@/pages/LoginPage';
import ProfessionalDashboard from '@/pages/ProfessionalDashboard';
import PatientsList from '@/pages/PatientsList';
import PatientProfile from '@/pages/PatientProfile';
import MealPlanEditor from '@/pages/MealPlanEditor';
import PatientDashboard from '@/pages/PatientDashboard';
import CalculatorsList from '@/pages/CalculatorsList';
import WeightCalculator from '@/pages/WeightCalculator';
import WaterCalculator from '@/pages/WaterCalculator';
import SettingsPage from '@/pages/SettingsPage';
import FoodDatabase from '@/pages/FoodDatabase';

const ProtectedRoute = ({ children, allowedTypes }) => {
  const userType = localStorage.getItem('fitjourney_user_type');
  
  if (!userType) {
    return <Navigate to="/" replace />;
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
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          
          <Route path="/professional/dashboard" element={
            <ProtectedRoute allowedTypes={['professional']}>
              <ProfessionalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/professional/patients" element={
            <ProtectedRoute allowedTypes={['professional']}>
              <PatientsList />
            </ProtectedRoute>
          } />
          <Route path="/professional/patient/:id" element={
            <ProtectedRoute allowedTypes={['professional']}>
              <PatientProfile />
            </ProtectedRoute>
          } />
          <Route path="/professional/meal-plan-editor" element={
            <ProtectedRoute allowedTypes={['professional']}>
              <MealPlanEditor />
            </ProtectedRoute>
          } />
          <Route path="/professional/settings" element={
            <ProtectedRoute allowedTypes={['professional']}>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/professional/food-database" element={
            <ProtectedRoute allowedTypes={['professional']}>
              <FoodDatabase />
            </ProtectedRoute>
          } />
          
          <Route path="/patient/dashboard" element={
            <ProtectedRoute allowedTypes={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/patient/meal-plan" element={
            <ProtectedRoute allowedTypes={['patient']}>
              <div className="p-8">Patient Meal Plan View (Mock)</div>
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
              <div className="p-8">Patient Feedback (Mock)</div>
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
      <Toaster />
    </div>
  );
}

export default App;