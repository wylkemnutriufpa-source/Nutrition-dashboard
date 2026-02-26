import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

const PatientListaCompras = () => {
  return (
    <Layout title="Lista de Compras" userType="patient">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Minha Lista de Compras</CardTitle>
            <CardDescription>
              Lista personalizada baseada no seu plano alimentar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-2">Funcionalidade em Desenvolvimento</p>
              <p className="text-sm text-gray-500">Em breve você terá uma lista automática de compras</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientListaCompras;
