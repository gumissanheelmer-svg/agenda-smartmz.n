
## Localização Inteligente (sem API externa)

### Resumo
Refatorar a aba "Localização" nas configurações do admin para incluir detecção automática de coordenadas a partir de links do Google Maps, usando apenas parsing client-side (regex). Sem APIs externas.

---

### 1. Refatorar `LocationSettingsTab.tsx`

Substituir o componente atual por uma versão com:

- **Campo principal**: Textarea com placeholder "Cole o link do Google Maps (ex: https://www.google.com/maps/...)"
- **Botão "Detectar localização"**: Executa parsing do texto colado
- **Lógica de parsing** (client-side, sem API):
  - Padrão `@(-?\d+\.\d+),(-?\d+\.\d+)` -> extrai lat/lng
  - Padrão `q=(-?\d+\.\d+),(-?\d+\.\d+)` -> extrai lat/lng
  - Padrão `place/.../@(-?\d+\.\d+),(-?\d+\.\d+)` -> extrai lat/lng
  - Padrão direto `-?\d+\.\d+,\s*-?\d+\.\d+` -> extrai lat/lng
- **Feedback**: Toast de sucesso com coordenadas detectadas ou erro se nao encontrar
- **Auto-preenchimento**: latitude e longitude nos campos existentes
- **Preview do mapa**: iframe embed `https://www.google.com/maps?q=LAT,LNG&output=embed` quando coordenadas existirem
- **Mensagem quando sem coordenadas**: "Cole um link completo do Google Maps para ativar a localização."
- Manter campos manuais existentes: location_name, address, city, neighborhood, latitude, longitude (editaveis)

---

### 2. Atualizar `LocationSection.tsx` (site publico)

- Quando existirem coordenadas: mostrar secao "Onde estamos" com mapa embed e botao "Obter direcoes"
- Quando nao existirem coordenadas: mostrar mensagem discreta "Cole um link completo do Google Maps para ativar a localização." em vez de "Localização ainda não configurada."
- Adicionar exibicao de `city` se disponivel

---

### 3. Ficheiros a modificar

| Ficheiro | Alteracao |
|---|---|
| `src/pages/admin/settings/LocationSettingsTab.tsx` | Refatorar: adicionar campo de link, botao detectar, parsing regex, preview mapa |
| `src/components/LocationSection.tsx` | Atualizar mensagem quando sem coordenadas, mostrar cidade |

---

### Detalhes Tecnicos

**Funcao de parsing (client-side)**:
```text
function extractCoordinates(input: string): { lat: number; lng: number } | null
  1. Tentar regex: /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
  2. Tentar regex: /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
  3. Tentar regex: /place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
  4. Tentar regex generico: /(-?\d+\.?\d+),\s*(-?\d+\.?\d+)/
  5. Validar ranges: lat entre -90 e 90, lng entre -180 e 180
  6. Retornar null se nenhum padrao encontrado
```

Sem migracoes de banco necessarias -- todos os campos (latitude, longitude, address, city, neighborhood, location_name) ja existem na tabela barbershops.

Sem edge functions -- tudo e feito no frontend com regex.
