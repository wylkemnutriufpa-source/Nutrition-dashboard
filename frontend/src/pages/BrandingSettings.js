import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useBranding } from '@/contexts/BrandingContext';
import {
  getProfessionalBranding,
  saveProfessionalBranding,
  resetToDefault,
  imageToBase64,
  DEFAULT_BRANDING
} from '@/utils/branding';

const BrandingSettings = () => {
  const { branding, refreshBranding } = useBranding();
  const userEmail = localStorage.getItem('fitjourney_user_email');
  
  const [formData, setFormData] = useState({
    logo: branding.logo || '',
    brandName: branding.brandName || '',
    primaryColor: branding.primaryColor || '',
    accentColor: branding.accentColor || '',
    footerText: branding.footerText || '',
    welcomeMessage: branding.welcomeMessage || ''
  });

  const [logoPreview, setLogoPreview] = useState(branding.logo);

  useEffect(() => {
    // Carregar branding atual
    const currentBranding = getProfessionalBranding(userEmail) || branding;
    setFormData({
      logo: currentBranding.logo || '',
      brandName: currentBranding.brandName || DEFAULT_BRANDING.brandName,
      primaryColor: currentBranding.primaryColor || DEFAULT_BRANDING.primaryColor,
      accentColor: currentBranding.accentColor || DEFAULT_BRANDING.accentColor,
      footerText: currentBranding.footerText || DEFAULT_BRANDING.footerText,
      welcomeMessage: currentBranding.welcomeMessage || DEFAULT_BRANDING.welcomeMessage
    });
    setLogoPreview(currentBranding.logo);
  }, [userEmail, branding]);

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

    try {
      const base64 = await imageToBase64(file);
      setFormData({ ...formData, logo: base64 });
      setLogoPreview(base64);
      toast.success('Logo carregada! Clique em Salvar para aplicar');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    }
  };

  const handleSave = () => {
    if (!formData.brandName) {
      toast.error('Nome da marca é obrigatório');
      return;
    }

    // Salvar branding do profissional
    saveProfessionalBranding(userEmail, formData);
    
    // Atualizar branding ativo
    refreshBranding();
    
    toast.success('Configurações de marca atualizadas com sucesso!');
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      const defaults = resetToDefault();
      setFormData({
        logo: '',
        brandName: defaults.brandName,
        primaryColor: defaults.primaryColor,
        accentColor: defaults.accentColor,
        footerText: defaults.footerText,
        welcomeMessage: defaults.welcomeMessage
      });
      setLogoPreview(null);
      refreshBranding();
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
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identidade da Marca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="brandName">Nome da Marca/Sistema</Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="Ex: NutriCare, MeuNutri, etc."
              />
              <p className="text-xs text-gray-500 mt-1">Este nome aparecerá no topo e no título das páginas</p>
            </div>

            <div>
              <Label htmlFor="welcomeMessage">Mensagem de Boas-Vindas</Label>
              <Textarea
                id="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                placeholder="Ex: Bem-vindo ao seu painel de nutrição personalizado"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="footerText">Texto do Rodapé</Label>
              <Input
                id="footerText"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                placeholder="Ex: Sua jornada para uma vida mais saudável"
              />
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
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-3 mt-2">
                  <input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20 h-12 rounded border-2 border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#0F766E"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Usada em botões principais e sidebar ativa</p>
              </div>

              <div>
                <Label htmlFor="accentColor">Cor de Destaque</Label>
                <div className="flex gap-3 mt-2">
                  <input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-20 h-12 rounded border-2 border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    placeholder="#059669"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Usada em elementos secundários e highlights</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Preview das Cores:</p>
              <div className="flex gap-4">
                <Button style={{ backgroundColor: formData.primaryColor }} className="text-white">
                  Botão Primário
                </Button>
                <Button style={{ backgroundColor: formData.accentColor }} className="text-white">
                  Botão Accent
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
              >
                Salvar Configurações
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
