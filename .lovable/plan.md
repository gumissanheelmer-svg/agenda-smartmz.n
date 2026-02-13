

## Adicionar Link Alternativo OpenStreetMap

Adicionar um terceiro CTA discreto abaixo dos botoes existentes, usando OpenStreetMap como fallback para casos onde o Google Maps nao funcione.

### Mudanca

**Ficheiro:** `src/components/LocationSection.tsx`

- Adicionar um link `<a>` com estilo outline/texto discreto (menor que os CTAs principais) logo apos o botao "Copiar localizacao"
- URL: `https://www.openstreetmap.org/directions?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
- Texto: "Abrir no mapa (alternativo)"
- Icone: `MapPin` ou `Navigation`
- Visivel apenas quando `hasCoords` for verdadeiro
- Estilo: texto branco/50, sem fundo, underline on hover — para nao competir visualmente com o CTA principal

### Detalhes Tecnicos

O link sera adicionado dentro do bloco de CTAs existente (linha ~157), como um terceiro item condicional apos "Copiar localizacao". Usara o mesmo padrao `<a target="_blank" rel="noopener noreferrer">` para garantir abertura em nova aba sem bloqueio.

