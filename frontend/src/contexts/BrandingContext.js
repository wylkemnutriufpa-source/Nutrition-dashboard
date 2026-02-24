import { createContext, useContext, useState, useEffect } from 'react';
import { getActiveBranding, applyBrandingToDOM } from '@/utils/branding';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(getActiveBranding());

  useEffect(() => {
    // Aplicar branding ao DOM quando mudar
    applyBrandingToDOM(branding);
  }, [branding]);

  const refreshBranding = () => {
    const newBranding = getActiveBranding();
    setBranding(newBranding);
    applyBrandingToDOM(newBranding);
  };

  return (
    <BrandingContext.Provider value={{ branding, setBranding, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
};
