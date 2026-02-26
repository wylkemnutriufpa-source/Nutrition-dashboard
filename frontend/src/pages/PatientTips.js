import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, Pin, Check, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientMessages, markMessageAsRead } from '@/lib/supabase';
import { toast } from 'sonner';

const PatientTips = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);
  const [selectedTip, setSelectedTip] = useState(null);

  useEffect(() => {
    if (user) loadTips();
  }, [user]);

  const loadTips = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPatientMessages(user.id, true);
      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Error loading tips:', error);
      toast.error('Erro ao carregar dicas');
    } finally {
      setLoading(false);
    }
  };

  const handleReadTip = async (tip) => {
    setSelectedTip(tip);
    if (!tip.is_read) {
      await markMessageAsRead(tip.id);
      setTips(prev => prev.map(t => 
        t.id === tip.id ? { ...t, is_read: true } : t
      ));
    }
  };

  const typeColors = {
    'dica': 'bg-teal-100 text-teal-700',
    'aviso': 'bg-amber-100 text-amber-700',
    'motivacao': 'bg-purple-100 text-purple-700',
    'informacao': 'bg-blue-100 text-blue-700'
  };

  const unreadCount = tips.filter(t => !t.is_read).length;

  if (loading) {
    return (
      <Layout title="Dicas" userType="patient">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      </Layout>
    );
  }

  // Visualização detalhada
  if (selectedTip) {
    return (
      <Layout title="Dicas" userType="patient">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedTip(null)}
            className="mb-4"
          >
            ← Voltar para dicas
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {selectedTip.is_pinned && (
                  <Pin className="text-teal-600" size={20} />
                )}
                <CardTitle className="text-xl">{selectedTip.title}</CardTitle>
              </div>
              {selectedTip.type && (
                <span className={`self-start px-3 py-1 rounded-full text-sm font-medium ${typeColors[selectedTip.type] || 'bg-gray-100 text-gray-700'}`}>
                  {selectedTip.type}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-teal max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTip.content}
                </p>
              </div>
              
              <div className="pt-4 border-t text-sm text-gray-500">
                Enviado em {new Date(selectedTip.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (tips.length === 0) {
    return (
      <Layout title="Dicas" userType="patient">
        <Card className="text-center py-12">
          <CardContent>
            <Lightbulb className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma dica disponível
            </h3>
            <p className="text-gray-600">
              Seu nutricionista ainda não enviou dicas para você.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  // Separar fixadas das normais
  const pinnedTips = tips.filter(t => t.is_pinned);
  const regularTips = tips.filter(t => !t.is_pinned);

  return (
    <Layout title="Dicas" userType="patient">
      <div className="space-y-6">
        {/* Header */}
        {unreadCount > 0 && (
          <Card className="bg-gradient-to-r from-teal-50 to-green-50 border-teal-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-full">
                <Sparkles className="text-teal-600" size={20} />
              </div>
              <p className="text-teal-800">
                Você tem <span className="font-bold">{unreadCount}</span> nova(s) dica(s) para ler!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dicas fixadas */}
        {pinnedTips.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Pin className="text-teal-600" size={18} />
              Fixadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pinnedTips.map(tip => (
                <Card 
                  key={tip.id} 
                  className={`cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-teal-500 ${
                    !tip.is_read ? 'bg-teal-50/50' : ''
                  }`}
                  onClick={() => handleReadTip(tip)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!tip.is_read && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                          )}
                          <h3 className="font-semibold text-gray-900">{tip.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {tip.content}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dicas regulares */}
        {regularTips.length > 0 && (
          <div className="space-y-3">
            {pinnedTips.length > 0 && (
              <h2 className="text-lg font-semibold text-gray-900">Outras dicas</h2>
            )}
            <div className="space-y-3">
              {regularTips.map(tip => (
                <Card 
                  key={tip.id} 
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    !tip.is_read ? 'border-l-4 border-l-teal-400 bg-teal-50/30' : ''
                  }`}
                  onClick={() => handleReadTip(tip)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!tip.is_read && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                          )}
                          <h3 className="font-semibold text-gray-900">{tip.title}</h3>
                          {tip.type && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[tip.type] || 'bg-gray-100 text-gray-700'}`}>
                              {tip.type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {tip.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(tip.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PatientTips;
