import { useBarbershop } from './useBarbershop';
import { getBusinessConfig, type BusinessType } from '@/lib/businessConfig';

export type { BusinessType };

export function useBusinessType() {
  const { barbershop } = useBarbershop();
  
  const businessType = (barbershop?.business_type || 'barbearia') as BusinessType;
  const config = getBusinessConfig(businessType);
  
  return {
    businessType,
    isBarbershop: businessType === 'barbearia',
    isSalon: businessType === 'salao',
    isHybrid: businessType === 'salao_barbearia',
    isAesthetics: businessType === 'estetica',
    isTattooStudio: businessType === 'tattoo_studio',
    
    // Dynamic labels based on business type
    professionalLabel: config.professionalLabel,
    professionalsLabel: config.professionalsLabel,
    businessLabel: config.label,
    supportsDeposit: config.supportsDeposit,
    
    // Status options based on business type
    getStatusOptions: () => {
      if (businessType === 'barbearia') {
        return ['pending', 'confirmed', 'completed', 'cancelled'];
      }
      return ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    },
    
    // Whether professionals should be filtered by service
    shouldFilterProfessionalsByService: businessType !== 'barbearia',
  };
}
