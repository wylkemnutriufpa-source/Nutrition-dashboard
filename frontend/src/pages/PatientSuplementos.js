import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pill } from 'lucide-react';

const PatientSuplementos = () => {
  return (
    <Layout title="Suplementos" userType="patient">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Meus Suplementos</CardTitle>
            <CardDescription>
              Suplementação recomendada para o seu objetivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Pill className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-2">Funcionalidade em Desenvolvimento</p>
              <p className="text-sm text-gray-500">Em breve você verá sua suplementação personalizada</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientSuplementos;
