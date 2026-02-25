// =============================================
// Business Type Configuration & Helpers
// =============================================

export type BusinessType = 'barbearia' | 'salao' | 'salao_barbearia' | 'estetica' | 'tattoo_studio';

export interface BusinessTypeConfig {
  label: string;
  professionalLabel: string;
  professionalsLabel: string;
  icon: string; // lucide icon name
  supportsDeposit: boolean;
}

export const BUSINESS_TYPE_CONFIG: Record<BusinessType, BusinessTypeConfig> = {
  barbearia: {
    label: 'Barbearia',
    professionalLabel: 'Barbeiro',
    professionalsLabel: 'Barbeiros',
    icon: 'scissors',
    supportsDeposit: false,
  },
  salao: {
    label: 'Salão de Beleza',
    professionalLabel: 'Profissional',
    professionalsLabel: 'Profissionais',
    icon: 'sparkles',
    supportsDeposit: false,
  },
  salao_barbearia: {
    label: 'Salão & Barbearia',
    professionalLabel: 'Profissional',
    professionalsLabel: 'Profissionais',
    icon: 'store',
    supportsDeposit: false,
  },
  estetica: {
    label: 'Estética',
    professionalLabel: 'Esteticista',
    professionalsLabel: 'Esteticistas',
    icon: 'heart',
    supportsDeposit: false,
  },
  tattoo_studio: {
    label: 'Estúdio de Tatuagem',
    professionalLabel: 'Tatuador',
    professionalsLabel: 'Tatuadores',
    icon: 'pen-tool',
    supportsDeposit: true,
  },
};

export const ALL_BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_CONFIG) as BusinessType[];

export function getBusinessConfig(type: string): BusinessTypeConfig {
  return BUSINESS_TYPE_CONFIG[type as BusinessType] || BUSINESS_TYPE_CONFIG.barbearia;
}

export function getBusinessLabel(type: string): string {
  return getBusinessConfig(type).label;
}

export function getProfessionalLabel(type: string, plural = false): string {
  const config = getBusinessConfig(type);
  return plural ? config.professionalsLabel : config.professionalLabel;
}
