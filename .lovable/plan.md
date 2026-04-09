
## Plano: Sistema de Preços por País

### 1. Banco de Dados (Migration)
- Criar tabela `plans` com: id, key, name, price, yearly_price, currency, country_code, max_professionals, features (jsonb), badge, is_default, active
- Adicionar `plan_id` na tabela `barbershops` (nullable, FK para plans)
- Criar RPC `check_professional_limit(p_barbershop_id)` que valida se o negócio pode adicionar mais profissionais
- Inserir os 6 planos (3 MZN + 3 USD)
- RLS: planos visíveis publicamente, apenas superadmin pode editar

### 2. Backend - Validação de Limites
- Criar trigger ou validação na RPC/frontend que bloqueia criação de profissionais acima do limite
- Atualizar `BarbersList.tsx` para verificar limite antes de adicionar

### 3. Frontend - PricingSection
- Atualizar `PricingSection.tsx` para buscar planos da tabela `plans` por país
- Mostrar 3 cards (Basic, Pro, Premium) com destaque no Pro
- Detectar país via landing settings ou seletor
- Mostrar limite de profissionais em cada card

### 4. Landing Settings
- Atualizar landing settings para usar planos da nova tabela em vez do JSONB

### Ordem: Migration → Seed data → Frontend → Validação
