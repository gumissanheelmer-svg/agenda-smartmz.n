

## Secao "Onde Estamos" Ultra Premium + Configuracoes de Localizacao e Media

### Resumo

Upgrade completo da secao "Onde estamos" no site publico com design ultra premium (glassmorphism, glow, float, micro-interacoes), e melhorias nas configuracoes do admin para suportar galeria de videos e localizacao inteligente com parse automatico de links do Google Maps.

---

### 1. Migracao de Banco de Dados

Adicionar novas colunas a tabela `barbershops`:

| Coluna | Tipo | Descricao |
|---|---|---|
| `maps_raw_link` | text, nullable | Link original do Google Maps colado pelo admin |
| `gallery_videos` | text[], default '{}' | URLs dos videos da galeria (ate 10) |
| `media_featured_url` | text, nullable | URL da midia em destaque |
| `media_featured_type` | text, nullable | "image" ou "video" |

Campos derivados (NAO armazenados, calculados no frontend):
- `maps_embed_url` = `https://www.google.com/maps?q=LAT,LNG&output=embed`
- `maps_directions_url` = `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`

Atualizar a RPC `get_public_barbershop` para incluir os novos campos.

---

### 2. Admin - Refatorar `LocationSettingsTab.tsx`

Redesenhar completamente o componente com:

**Bloco A - Localizacao Inteligente:**
- Textarea: "Cole o link do Google Maps"
- Parse automatico `onBlur` + botao "Detectar localizacao"
- Regex: `/@(-?\d+\.?\d*),(-?\d+\.?\d*)` e `q=(-?\d+\.?\d*),(-?\d+\.?\d*)`
- Auto-preencher latitude e longitude (read-only apos deteccao)
- Campo de endereco editavel
- Preview do mapa iframe quando coordenadas existirem
- Feedback: toast sucesso/erro com animacao

**Bloco B - Galeria de Videos (novo):**
- Upload de ate 10 videos (MP4/WEBM, max 25MB cada)
- Grid de thumbnails com botao remover
- Armazenados no bucket `videos` com path `{business_id}/gallery-video-{timestamp}.{ext}`

**Bloco C - Midia em Destaque:**
- Selector para escolher 1 item (foto ou video) como destaque
- Dropdown que lista todas as fotos da galeria + todos os videos
- Preview do item selecionado

---

### 3. Admin - Atualizar `SettingsPage.tsx`

- Adicionar `maps_raw_link`, `gallery_videos`, `media_featured_url`, `media_featured_type` a interface `BarbershopSettings`
- Incluir esses campos no `handleSave`

---

### 4. Atualizar `useBarbershop.tsx`

- Adicionar os novos campos a interface `Barbershop`
- Mapear no `setBarbershopBySlug`

---

### 5. Site Publico - Refatorar `LocationSection.tsx` (Ultra Premium)

Design completamente novo:

**Visual:**
- Fundo: `#070A0F` com gradiente sutil
- Cards glassmorphism: `rgba(255,255,255,0.06)` + `backdrop-filter: blur(14px)` + borda `rgba(255,255,255,0.10)`
- Glow accent dourado suave no CTA: `box-shadow: 0 0 24px rgba(214,177,94,0.28)`
- Animacao float: cards sobem/descem 6px em loop 5-7s
- Scroll reveal: fade-in + slide-up 12px ao entrar no viewport
- Hover: scale 1.01 + sombra elevada + borda mais visivel

**Layout Desktop (2 colunas):**
- Esquerda: Card glass com titulo "Onde estamos" + texto persuasivo + endereco + CTAs
- Direita: Card glass com mapa iframe (cantos 20px, sombra suave)

**Layout Mobile (empilhado):**
- Titulo + texto + CTAs
- Mapa
- Galeria "Conheca o espaco"

**CTAs:**
1. Primario (glow dourado): "Tracar rota agora — te esperamos" -> abre `maps_directions_url`
2. Secundario (outline): "Copiar localizacao" -> copia "LAT,LNG" para clipboard + toast

**Galeria "Conheca o Espaco":**
- Carrossel horizontal com Embla Carousel (ja instalado)
- Mostra `media_featured` maior + thumbnails das gallery_images e gallery_videos
- Videos com preview muted, play on tap
- Swipe no mobile

**Micro-interacoes:**
- CTA com brilho "respirando" (pulse suave via keyframe)
- Toasts elegantes: "Copiado", "Abrindo direcoes..."

**Quando sem coordenadas:**
- Ocultar iframe
- Mostrar card glass com mensagem: "Localizacao ainda nao configurada. Peca ao estabelecimento para adicionar o link do Google Maps nas Configuracoes."

**Quando sem midia:**
- Placeholder premium: icone + "Fotos do espaco em breve."

---

### 6. Atualizar `LandingPage.tsx` e `BarbershopHome.tsx`

- Passar novos props (gallery_videos, media_featured_url, media_featured_type) para LocationSection

---

### Ficheiros a criar/modificar

| Ficheiro | Acao |
|---|---|
| Migracao SQL | Criar: adicionar colunas + atualizar RPC |
| `src/pages/admin/settings/LocationSettingsTab.tsx` | Modificar: redesenhar com bloco localizacao + videos + destaque |
| `src/pages/admin/SettingsPage.tsx` | Modificar: adicionar novos campos |
| `src/hooks/useBarbershop.tsx` | Modificar: adicionar novos campos |
| `src/components/LocationSection.tsx` | Modificar: redesign ultra premium completo |
| `src/components/LandingPage.tsx` | Modificar: passar novos props |
| `src/pages/BarbershopHome.tsx` | Modificar: passar novos props |

---

### Detalhes Tecnicos

**Parse do link Google Maps (client-side):**
```text
function extractLatLngFromGoogleMapsLink(link):
  1. Regex /@(-?\d+\.?\d*),(-?\d+\.?\d*)/ -> lat, lng
  2. Regex /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/ -> lat, lng
  3. Validar: lat entre -90/90, lng entre -180/180
  4. Se falhar: toast erro "Nao consegui ler as coordenadas..."
  5. Se ok: preencher lat/lng, gerar embed e directions URLs
```

**URLs derivadas (nunca armazenadas):**
```text
maps_embed_url = https://www.google.com/maps?q={lat},{lng}&output=embed
maps_directions_url = https://www.google.com/maps/dir/?api=1&destination={lat},{lng}
```

**Galeria - Embla Carousel:**
- Ja instalado (`embla-carousel-react ^8.6.0`)
- Usado para carrossel horizontal de fotos + videos
- Dots de navegacao + swipe nativo

**Animacoes Framer Motion:**
- Float: `y: [0, -6, 0]` com duracao 6s, loop infinito
- Scroll reveal: `initial={{ opacity: 0, y: 12 }}` + `whileInView={{ opacity: 1, y: 0 }}`
- Hover: `whileHover={{ scale: 1.01 }}`
- CTA pulse: keyframe CSS `@keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(214,177,94,0.2) } 50% { box-shadow: 0 0 30px rgba(214,177,94,0.4) } }`

