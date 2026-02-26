import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const PatientReceitas = () => {
  return (
    <Layout title="Minhas Receitas" userType="patient">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Receitas Exclusivas</CardTitle>
            <CardDescription>
              Receitas saudáveis e deliciosas do seu plano alimentar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-2">Funcionalidade em Desenvolvimento</p>
              <p className="text-sm text-gray-500">Em breve você terá acesso a receitas exclusivas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientReceitas;
