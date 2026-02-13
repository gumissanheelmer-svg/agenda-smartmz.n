

## Localização Inteligente - Plano de Implementação

### Resumo
Adicionar um campo inteligente na aba Localização das Configurações do Admin onde o admin pode colar um link do Google Maps, Plus Code ou coordenadas, e o sistema automaticamente detecta lat/lng, preenche endereço, cidade e país, e mostra preview do mapa.

---

### 1. Configuração da API Key

O sistema precisa de uma chave da **Google Geocoding API** para converter endereços/Plus Codes em coordenadas.

- Solicitar ao utilizador a chave `GOOGLE_MAPS_API_KEY` via ferramenta de segredos
- A chave será usada apenas no backend (edge function), nunca exposta no frontend

---

### 2. Backend - Edge Function `geocode`

Criar `supabase/functions/geocode/index.ts`:

- Recebe `{ inputText }` via POST
- Lógica de detecção:
  1. **Coordenadas diretas**: regex `-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?` -> usa reverse geocoding para obter endereço
  2. **Link do Google Maps**: extrai coords de `@lat,lng` ou `q=lat,lng` ou `/place/...` -> reverse geocoding
  3. **Plus Code ou endereço textual**: chama Google Geocoding API (forward geocoding)
- Retorna: `{ lat, lng, formattedAddress, city, country }`
- Autenticação: requer token JWT do utilizador logado

---

### 3. Migração de Banco de Dados

Adicionar coluna `country` (text, nullable) à tabela `barbershops` e atualizar a RPC `get_public_barbershop` para incluí-la.

---

### 4. Frontend - Refatorar `LocationSettingsTab`

Substituir o componente atual por uma versão com "Localização Inteligente":

- **Novo campo principal**: textarea/input com placeholder "Cole um link do Google Maps, Plus Code ou endereço"
- **Botão "Detectar Localização"**: chama a edge function, mostra loading spinner
- **Feedback**: toast de sucesso/erro
- **Campos auto-preenchidos** (editáveis): endereço, cidade, país (novo), latitude, longitude
- **Preview do mapa**: iframe embed quando lat/lng existirem
- Manter campos existentes (location_name, neighborhood) editáveis manualmente

---

### 5. Atualizar `SettingsPage` e `useBarbershop`

- Adicionar `country` ao `handleSave` e à interface `BarbershopSettings`
- Adicionar `country` ao hook `useBarbershop`

---

### 6. Site Público - `LocationSection`

- Já funciona corretamente com lat/lng existentes
- Adicionar exibição de `city` e `country` quando disponíveis
- Já esconde a seção quando não há coordenadas

---

### Detalhes Técnicos

**Parsing de URLs do Google Maps** (na edge function):
```text
Padrões suportados:
- https://maps.google.com/maps?q=LAT,LNG
- https://www.google.com/maps/@LAT,LNG,Z
- https://www.google.com/maps/place/.../@LAT,LNG
- https://goo.gl/maps/... (seguir redirect)
- Plus Codes: RHVP+J9F, Tete, Moçambique
- Coordenadas: -25.9692, 32.5732
```

**Fluxo da Edge Function**:
```text
inputText
  |
  +--> regex coords? ---> reverse geocode ---> { lat, lng, address, city, country }
  |
  +--> Google Maps URL? ---> extrair coords ---> reverse geocode ---> resultado
  |
  +--> Outro texto? ---> forward geocode ---> resultado
```

**Ficheiros a criar/modificar**:
- Criar: `supabase/functions/geocode/index.ts`
- Modificar: `src/pages/admin/settings/LocationSettingsTab.tsx` (refatorar completamente)
- Modificar: `src/pages/admin/SettingsPage.tsx` (adicionar `country`)
- Modificar: `src/hooks/useBarbershop.tsx` (adicionar `country`)
- Modificar: `src/components/LocationSection.tsx` (exibir cidade/país)
- Migração SQL: adicionar coluna `country`, atualizar RPC

