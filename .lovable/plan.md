
# Atualizar FinalCTA para redirecionar ao WhatsApp

## O que muda

O botao "Comecar Agora -- E Gratis" na secao final da landing (FinalCTA) sera atualizado para:

1. **Texto**: "Quero Meu Negocio Automatizado" (igual ao Hero)
2. **Acao**: Ao clicar, abre o WhatsApp com a mensagem configurada no SuperAdmin (mesmo comportamento do botao do Hero)
3. **Fallback**: Se o WhatsApp nao estiver configurado, redireciona para `/register`

## Alteracoes tecnicas

### Arquivo: `src/components/landing/FinalCTA.tsx`

- Importar `useLandingSettings` para obter `wa_sales_phone`, `wa_sales_message_template` e `wa_sales_enabled`
- Reutilizar a funcao `buildWhatsAppLink` de `BarbershopList.tsx` (ou extrair para utils) para gerar o link correto (wa.me no mobile, web.whatsapp.com no desktop)
- Substituir o `<Link to="/register">` por `<a href={waLink}>` quando WhatsApp estiver ativo
- Manter fallback para `/register` quando desativado
- Texto do botao: "Quero Meu Negocio Automatizado"

### Refatoracao menor

- Extrair `buildWhatsAppLink` para `src/lib/whatsapp.ts` (ja existe o arquivo com helpers de WhatsApp) para evitar duplicacao entre `BarbershopList.tsx` e `FinalCTA.tsx`

Nenhuma mudanca de layout, design ou rotas existentes.
