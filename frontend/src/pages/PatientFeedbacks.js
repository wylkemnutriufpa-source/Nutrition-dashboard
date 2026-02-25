import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Camera, Send } from 'lucide-react';

const PatientFeedbacks = () => {
  return (
    <Layout title="Meus Feedbacks" userType="patient">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Envie seu Feedback</CardTitle>
            <CardDescription>
              Compartilhe seu progresso, dúvidas ou conquistas com seu nutricionista
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-2">Funcionalidade em Desenvolvimento</p>
              <p className="text-sm text-gray-500 mb-4">Em breve você poderá enviar fotos e mensagens de progresso</p>
              <Button className="bg-teal-600 hover:bg-teal-700" disabled>
                <Camera className="mr-2" size={18} />
                Enviar Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientFeedbacks;
