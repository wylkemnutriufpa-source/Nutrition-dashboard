import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Upload, RotateCcw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBranding } from '@/contexts/BrandingContext';
import { saveProfessionalBranding, DEFAULT_BRANDING } from '@/utils/branding';
import { getCurrentUser, getProfessionalProfile, supabase } from '@/lib/supabase';

const BrandingSettings = () => {
  const { branding, refreshBranding } = useBranding();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [professionalId, setProfessionalId] = useState(null);
  
  const [formData, setFormData] = useState({
    logo_url: '',
    primary_color: DEFAULT_BRANDING.primary_color,
    secondary_color: DEFAULT_BRANDING.secondary_color,
    accent_color: DEFAULT_BRANDING.accent_color
  });

  useEffect(() => {
    loadProfessionalData();
  }, []);

  useEffect(() => {
    // Atualizar form com branding carregado do contexto
    if (branding) {
      setFormData({
        logo_url: branding.logo_url || '',
        primary_color: branding.primary_color || DEFAULT_BRANDING.primary_color,
        secondary_color: branding.secondary_color || DEFAULT_BRANDING.secondary_color,
        accent_color: branding.accent_color || DEFAULT_BRANDING.accent_color
      });
    }
  }, [branding]);

  const loadProfessionalData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data: profile, error } = await getProfessionalProfile(user.id);
      if (error || !profile) {
        toast.error('Perfil profissional não encontrado');
        return;
      }

      setProfessionalId(profile.id);
    } catch (error) {
      console.error('Erro ao carregar dados do profissional:', error);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande! Máximo 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    setUploading(true);
    try {
      // Upload para Supabase Storage
      const fileName = `${professionalId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('branding')
        .upload(`logos/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('branding')
        .getPublicUrl(`logos/${fileName}`);

      setFormData({ ...formData, logo_url: publicData.publicUrl });
      toast.success('Logo carregada! Clique em Salvar para aplicar');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!professionalId) {
      toast.error('Profissional não identificado');
      return;
    }

    setLoading(true);
    try {
      const result = await saveProfessionalBranding(professionalId, formData);
      
      if (result.success) {
        await refreshBranding();
        toast.success('Configurações de marca atualizadas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setFormData({
        logo_url: '',
        primary_color: DEFAULT_BRANDING.primary_color,
        secondary_color: DEFAULT_BRANDING.secondary_color,
        accent_color: DEFAULT_BRANDING.accent_color
      });
      
      // Salvar o reset
      if (professionalId) {
        await saveProfessionalBranding(professionalId, {
          logo_url: null,
          primary_color: DEFAULT_BRANDING.primary_color,
          secondary_color: DEFAULT_BRANDING.secondary_color,
          accent_color: DEFAULT_BRANDING.accent_color
        });
        await refreshBranding();
      }
      
      toast.success('Configurações restauradas para o padrão');
    }
  };

  return (
    <Layout title="Personalização da Marca" showBack userType="professional">
      <div data-testid="branding-settings" className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Palette className="text-teal-700" size={24} />
                <div>
                  <CardTitle>White-Label / Branding</CardTitle>
                  <CardDescription>
                    Personalize a aparência do sistema com sua identidade visual
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="text-gray-600"
                disabled={loading}
              >
                <RotateCcw size={16} className="mr-2" />
                Restaurar Padrão
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="mr-2 text-teal-700" size={20} />
              Logo da Marca
            </CardTitle>
            <CardDescription>
              Faça upload do logo que aparecerá no topo e na sidebar (recomendado: 200x200px, PNG com fundo transparente)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {uploading ? (
                  <Loader2 className="animate-spin text-teal-700" size={32} />
                ) : formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                ) : (
                  <Upload className="text-gray-400" size={32} />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-teal-300 rounded-lg p-6 hover:border-teal-500 transition-colors text-center">
                    <Upload className="mx-auto text-teal-700 mb-2" size={24} />
                    <p className="text-sm font-medium text-gray-700">Clique para fazer upload</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB</p>
                  </div>
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cores da Marca</CardTitle>
            <CardDescription>
              Escolha as cores que representam sua marca. Elas serão aplicadas em botões, links e destaques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-3 mt-2">
                  <input
                    id="primaryColor"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-20 h-12 rounded border-2 border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#059669"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Cor principal</p>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-3 mt-2">
                  <input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-20 h-12 rounded border-2 border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    placeholder="#10b981"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Cor alternativa</p>
              </div>

              <div>
                <Label htmlFor="accentColor">Cor de Destaque</Label>
                <div className="flex gap-3 mt-2">
                  <input
                    id="accentColor"
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-20 h-12 rounded border-2 border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    placeholder="#34d399"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Destaques</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Preview das Cores:</p>
              <div className="flex gap-4">
                <Button style={{ backgroundColor: formData.primary_color }} className="text-white">
                  Primária
                </Button>
                <Button style={{ backgroundColor: formData.secondary_color }} className="text-white">
                  Secundária
                </Button>
                <Button style={{ backgroundColor: formData.accent_color }} className="text-white">
                  Destaque
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                className="flex-1 bg-teal-700 hover:bg-teal-800"
                size="lg"
                disabled={loading || !professionalId}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="lg"
              >
                Visualizar Mudanças
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              As alterações serão aplicadas imediatamente após salvar. Recarregue a página para ver o efeito completo.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BrandingSettings;
